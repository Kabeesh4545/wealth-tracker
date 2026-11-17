import api from './api';

// Fetch all onboarding data if it exists for the user
export async function getOnboardingData() {
  try {
    // 1. Fetch Profile
    let profile = null;
    try {
      const res = await api.get('/api/profile');
      profile = res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // No profile exists yet, return null
        return null;
      }
      throw err;
    }

    // 2. Fetch other sections (if profile exists)
    const [loansRes, expensesRes, savingsRes, investmentsRes, goalsRes, ipRes] = await Promise.all([
      api.get('/api/loans').catch(() => ({ data: [] })),
      api.get('/api/planned-expenses').catch(() => ({ data: [] })),
      api.get('/api/savings').catch(() => ({ data: null })),
      api.get('/api/investments').catch(() => ({ data: [] })),
      api.get('/api/goals').catch(() => ({ data: [] })),
      api.get('/api/investment-profile').catch(() => ({ data: null }))
    ]);

    // Map database models back to React formData structure
    const data = {
      personal: {
        age: profile.age || '',
        city: profile.city || '',
        employmentType: profile.employment_type || '',
        familyMembers: profile.family_members !== null ? profile.family_members : '',
        dependents: profile.dependents !== null ? profile.dependents : '',
      },
      income: {
        monthlySalary: profile.monthly_salary || '',
        otherIncome: profile.other_income || '',
        variableIncome: profile.variable_income || '',
      },
      housing: {
        situation: profile.housing_type || '',
        rentAmount: profile.rent_amount || '',
        maintenance: profile.maintenance || '',
        hasHomeLoan: profile.has_home_loan || '',
        homeLoanEmi: profile.home_loan_emi || '',
        householdContribution: profile.household_contribution || '',
        otherHousingExpenses: profile.other_housing_expenses || '',
      },
      hasLoans: loansRes.data.length > 0 ? 'Yes' : 'No',
      loans: loansRes.data.map(l => ({
        id: l.id, // Use database integer ID
        type: l.loan_type,
        outstandingAmount: l.outstanding_amount || '',
        emi: l.monthly_emi || '',
        interestRate: l.interest_rate || '',
        tenure: l.remaining_tenure_months || ''
      })),
      expenses: {
        essential: {
          foodGroceries: '',
          transportation: '',
          electricity: '',
          water: '',
          internet: '',
          mobile: '',
          healthcare: '',
          education: '',
          insurance: '',
        },
        lifestyle: {
          shopping: '',
          entertainment: '',
          eatingOutside: '',
          travel: '',
          subscriptions: '',
          hobbies: '',
          other: '',
        }
      },
      savings: {
        bankSavings: savingsRes.data ? savingsRes.data.bank_savings : '',
        emergencyFund: savingsRes.data ? savingsRes.data.emergency_fund : '',
      },
      investments: investmentsRes.data.map(i => ({
        id: i.id,
        type: i.investment_type,
        amount: i.amount
      })),
      goals: goalsRes.data.map(g => ({
        id: g.id,
        name: g.goal_name,
        targetAmount: g.target_amount,
        currentSaved: g.current_amount,
        targetDate: g.target_date
      })),
      investmentProfile: {
        experience: ipRes.data ? ipRes.data.experience : '',
        horizon: ipRes.data ? ipRes.data.time_horizon : '',
        riskTolerance: ipRes.data ? ipRes.data.risk_tolerance : '',
        preference: ipRes.data ? ipRes.data.primary_preference : '',
      }
    };

    // Populate expenses from flat DB rows
    expensesRes.data.forEach(exp => {
      const type = exp.expense_type; // 'essential' | 'lifestyle'
      const category = exp.category;
      if (data.expenses[type] && category in data.expenses[type]) {
        data.expenses[type][category] = exp.monthly_amount !== 0 ? exp.monthly_amount : '';
      }
    });

    return data;
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    throw error;
  }
}

// Synchronize frontend lists with database lists
async function syncList(endpoint, currentItems, dbItems, mapToDb, verifyEqual) {
  // Identify items to create (no integer id or not matching database)
  const itemsToCreate = currentItems.filter(item => typeof item.id === 'string' || !item.id);
  
  // Identify items to update
  const itemsToUpdate = currentItems.filter(item => typeof item.id === 'number');

  // Identify items to delete (in database, but not in current list)
  const itemsToDelete = dbItems.filter(dbItem => !currentItems.some(item => item.id === dbItem.id));

  // Perform updates
  for (const item of itemsToUpdate) {
    const payload = mapToDb(item);
    await api.put(`${endpoint}/${item.id}`, payload);
  }

  // Perform creations
  for (const item of itemsToCreate) {
    const payload = mapToDb(item);
    await api.post(endpoint, payload);
  }

  // Perform deletions
  for (const item of itemsToDelete) {
    await api.delete(`${endpoint}/${item.id}`);
  }
}

// Submit/sync the entire profile data to backend
export async function submitOnboardingData(formData, statusCallback = () => {}) {
  try {
    // 1. Submit/Update Core Profile
    statusCallback("Saving your financial profile...");
    const profilePayload = {
      age: Number(formData.personal.age),
      city: formData.personal.city,
      employment_type: formData.personal.employmentType,
      family_members: formData.personal.familyMembers !== '' ? Number(formData.personal.familyMembers) : null,
      dependents: formData.personal.dependents !== '' ? Number(formData.personal.dependents) : null,
      monthly_salary: Number(formData.income.monthlySalary || 0),
      other_income: Number(formData.income.otherIncome || 0),
      variable_income: Number(formData.income.variableIncome || 0),
      housing_type: formData.housing.situation,
      rent_amount: Number(formData.housing.rentAmount || 0),
      maintenance: Number(formData.housing.maintenance || 0),
      has_home_loan: formData.housing.hasHomeLoan || null,
      home_loan_emi: Number(formData.housing.homeLoanEmi || 0),
      household_contribution: Number(formData.housing.householdContribution || 0),
      other_housing_expenses: Number(formData.housing.otherHousingExpenses || 0)
    };

    let hasProfile = false;
    try {
      await api.get('/api/profile');
      hasProfile = true;
    } catch (err) {
      if (err.response && err.response.status !== 404) throw err;
    }

    if (hasProfile) {
      await api.put('/api/profile', profilePayload);
    } else {
      await api.post('/api/profile', profilePayload);
    }

    // 2. Synchronize Loans
    statusCallback("Saving loans...");
    const dbLoans = await api.get('/api/loans').then(res => res.data).catch(() => []);
    const loansToSync = formData.hasLoans === 'Yes' ? formData.loans : [];
    await syncList(
      '/api/loans',
      loansToSync,
      dbLoans,
      (loan) => ({
        loan_type: loan.type,
        outstanding_amount: Number(loan.outstandingAmount || 0),
        monthly_emi: Number(loan.emi || 0),
        interest_rate: Number(loan.interestRate || 0),
        remaining_tenure_months: Number(loan.tenure || 0)
      })
    );

    // 3. Synchronize Expenses
    statusCallback("Saving monthly expenses...");
    const dbExpenses = await api.get('/api/planned-expenses').then(res => res.data).catch(() => []);
    
    // Flatten current frontend expenses
    const currentExpenses = [];
    
    // Essential
    Object.keys(formData.expenses.essential).forEach(category => {
      const amount = Number(formData.expenses.essential[category] || 0);
      if (amount > 0) {
        currentExpenses.push({ category, expense_type: 'essential', monthly_amount: amount });
      }
    });

    // Lifestyle
    Object.keys(formData.expenses.lifestyle).forEach(category => {
      const amount = Number(formData.expenses.lifestyle[category] || 0);
      if (amount > 0) {
        currentExpenses.push({ category, expense_type: 'lifestyle', monthly_amount: amount });
      }
    });

    // Sync flat expense rows
    // Identify created / updated / deleted
    for (const curExp of currentExpenses) {
      const existing = dbExpenses.find(
        dbExp => dbExp.category === curExp.category && dbExp.expense_type === curExp.expense_type
      );
      if (existing) {
        if (existing.monthly_amount !== curExp.monthly_amount) {
          await api.put(`/api/planned-expenses/${existing.id}`, {
            category: curExp.category,
            expense_type: curExp.expense_type,
            monthly_amount: curExp.monthly_amount
          });
        }
      } else {
        await api.post('/api/planned-expenses', {
          category: curExp.category,
          expense_type: curExp.expense_type,
          monthly_amount: curExp.monthly_amount
        });
      }
    }

    // Delete expenses that are no longer present (or went to 0)
    const expensesToDelete = dbExpenses.filter(
      dbExp => !currentExpenses.some(curExp => curExp.category === dbExp.category && curExp.expense_type === dbExp.expense_type)
    );
    for (const exp of expensesToDelete) {
      await api.delete(`/api/planned-expenses/${exp.id}`);
    }

    // 4. Submit Savings
    statusCallback("Saving cash balances...");
    const savingsPayload = {
      bank_savings: Number(formData.savings.bankSavings || 0),
      emergency_fund: Number(formData.savings.emergencyFund || 0)
    };
    let hasSavings = false;
    try {
      await api.get('/api/savings');
      hasSavings = true;
    } catch (err) {
      if (err.response && err.response.status !== 404) throw err;
    }
    if (hasSavings) {
      await api.put('/api/savings', savingsPayload);
    } else {
      await api.post('/api/savings', savingsPayload);
    }

    // 5. Synchronize Investments
    statusCallback("Saving investments...");
    const dbInvestments = await api.get('/api/investments').then(res => res.data).catch(() => []);
    await syncList(
      '/api/investments',
      formData.investments,
      dbInvestments,
      (inv) => ({
        investment_type: inv.type,
        amount: Number(inv.amount || 0)
      })
    );

    // 6. Synchronize Goals
    statusCallback("Saving financial goals...");
    const dbGoals = await api.get('/api/goals').then(res => res.data).catch(() => []);
    await syncList(
      '/api/goals',
      formData.goals,
      dbGoals,
      (g) => ({
        goal_name: g.name,
        target_amount: Number(g.targetAmount || 0),
        current_amount: Number(g.currentSaved || 0),
        target_date: g.targetDate // e.g. 'YYYY-MM'
      })
    );

    // 7. Submit Investment Profile
    statusCallback("Saving investment profile...");
    const ipPayload = {
      experience: formData.investmentProfile.experience,
      time_horizon: formData.investmentProfile.horizon,
      risk_tolerance: formData.investmentProfile.riskTolerance,
      primary_preference: formData.investmentProfile.preference
    };
    let hasIp = false;
    try {
      await api.get('/api/investment-profile');
      hasIp = true;
    } catch (err) {
      if (err.response && err.response.status !== 404) throw err;
    }
    if (hasIp) {
      await api.put('/api/investment-profile', ipPayload);
    } else {
      await api.post('/api/investment-profile', ipPayload);
    }

    statusCallback("Profile saved successfully!");
  } catch (error) {
    console.error("Error submitting onboarding profile:", error);
    throw error;
  }
}
