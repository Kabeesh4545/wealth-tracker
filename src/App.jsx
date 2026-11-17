import React, { useState, useEffect } from 'react';
import { FormInput, SearchableDropdown } from './components/FormInput';
import api from './services/api';
import { getOnboardingData, submitOnboardingData } from './services/onboardingService';
import FinancialPlan from './components/planning/FinancialPlan';
import FinancialPlanReady from './components/financial-plan/FinancialPlanReady';
import FinancialDashboard from './components/dashboard/FinancialDashboard';
import ExpenseTracker from './components/expenses/ExpenseTracker';
import GoalDetailsView from './components/goals/GoalDetailsView';
import FinancialSimulator from './components/simulator/FinancialSimulator';
import FinancialAssistant from './components/assistant/FinancialAssistant';
import DataSourcesDashboard from './components/dashboard/DataSourcesDashboard';
import {
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  User,
  Briefcase,
  Home,
  CreditCard,
  Wallet,
  Target,
  BarChart2,
  Lock,
  LogOut,
  Mail,
  Loader2
} from 'lucide-react';

const CITIES = [
  'Coimbatore', 'Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai',
  'Delhi', 'Pune', 'Kochi', 'Madurai', 'Salem', 'Tiruppur', 'Erode'
];

const EMPLOYMENT_TYPES = [
  'Student', 'Employee', 'Self-employed', 'Business Owner', 'Freelancer', 'Other'
];

const INVESTMENT_TYPES = [
  'Fixed Deposit', 'Recurring Deposit', 'Mutual Funds', 'Stocks', 'Gold', 'Other'
];

const GOAL_TYPES = [
  'Emergency Fund', 'Buy Vehicle', 'Education', 'Buy House',
  'Marriage', 'Travel', 'Retirement', 'Debt Repayment', 'Other'
];

const initialFormData = {
  personal: {
    age: '',
    city: '',
    employmentType: '',
    familyMembers: '',
    dependents: '',
  },
  income: {
    monthlySalary: '',
    otherIncome: '',
    variableIncome: '',
  },
  housing: {
    situation: '', // 'Rent' | 'Own House' | 'Living With Family' | 'Other'
    rentAmount: '',
    maintenance: '',
    hasHomeLoan: '', // 'Yes' | 'No'
    homeLoanEmi: '',
    householdContribution: '',
    otherHousingExpenses: '',
  },
  hasLoans: '', // 'Yes' | 'No'
  loans: [], // Array of { id, type, outstandingAmount, emi, interestRate, tenure }
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
    bankSavings: '',
    emergencyFund: '',
  },
  investments: [], // Array of { id, type, amount }
  goals: [], // Array of { id, name, targetAmount, currentSaved, targetDate }
  investmentProfile: {
    experience: '',
    horizon: '',
    riskTolerance: '',
    preference: '',
  }
};

export default function App() {
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Intro, 11 = Success
  const [view, setView] = useState('onboarding'); // 'onboarding' | 'plan'
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [errors, setErrors] = useState({});

  const renderNavigationTabs = (activeTab) => {
    return (
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 text-xs font-bold text-slate-500 no-scrollbar sm:flex-wrap">
        <button
          onClick={() => setView('plan-ready')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'plan-ready' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Action Plan
        </button>
        <button
          onClick={() => setView('dashboard')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'dashboard' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Analytics Dashboard
        </button>
        <button
          onClick={() => setView('plan')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'plan' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Financial Plan
        </button>
        <button
          onClick={() => setView('expenses')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'expenses' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Expense Tracker
        </button>
        <button
          onClick={() => setView('goals')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'goals' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Financial Goals
        </button>
        <button
          onClick={() => setView('simulator')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'simulator' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          What-If Simulator
        </button>
        <button
          onClick={() => setView('assistant')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'assistant' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          AI Assistant
        </button>
        <button
          onClick={() => setView('data-sources')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'data-sources' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Data Sources & Provenance
        </button>
        <button
          onClick={() => { setView('onboarding'); setCurrentStep(10); }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'onboarding' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
        >
          Edit Profile
        </button>
      </div>
    );
  };

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Auth Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '' });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Loan Sub-form state
  const [newLoan, setNewLoan] = useState({
    type: '',
    outstandingAmount: '',
    emi: '',
    interestRate: '',
    tenure: ''
  });
  const [loanFormError, setLoanFormError] = useState('');

  // Investment Sub-form state
  const [newInvestment, setNewInvestment] = useState({
    type: '',
    amount: ''
  });
  const [investmentFormError, setInvestmentFormError] = useState('');

  // Goal Sub-form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentSaved: '',
    targetDate: ''
  });
  const [goalFormError, setGoalFormError] = useState('');

  // Listening to authorization expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setToken('');
      setCurrentUser(null);
      setFormData(initialFormData);
      setAuthError('Your session has expired. Please log in again.');
      setCurrentStep(1);
      setView('onboarding');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Fetch current user details and their onboarding data on load
  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserData();
    }
  }, [isAuthenticated, token]);

  const loadUserData = async () => {
    try {
      setAuthLoading(true);
      // Fetch user profile
      const userRes = await api.get('/api/auth/me');
      setCurrentUser(userRes.data);

      // Fetch financial profile
      const onboardingData = await getOnboardingData();
      if (onboardingData) {
        setFormData(onboardingData);
        // Jump directly to Review Step since profile exists
        setCurrentStep(10);
        setView('plan-ready');
      } else {
        setFormData(initialFormData);
        setCurrentStep(1);
        setView('onboarding');
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      // If unauthorized, interceptor handles clearing token
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setFormData(initialFormData);
    setCurrentStep(1);
    setView('onboarding');
    setAuthError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = loginForm.email ? loginForm.email.trim().toLowerCase() : '';
    const cleanPassword = loginForm.password ? loginForm.password.trim() : '';

    if (!cleanEmail || !cleanPassword) {
      setAuthError('Please fill out all fields.');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError('');
      
      const formDataBody = new URLSearchParams();
      formDataBody.append('username', cleanEmail);
      formDataBody.append('password', cleanPassword);

      const res = await api.post('/api/auth/login', formDataBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const accessToken = res.data.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setIsAuthenticated(true);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      console.error("Login failed:", err);
      let errMsg = 'Unable to log in. Please check your credentials.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanFullName = registerForm.fullName ? registerForm.fullName.trim() : '';
    const cleanEmail = registerForm.email ? registerForm.email.trim().toLowerCase() : '';
    const cleanPassword = registerForm.password ? registerForm.password.trim() : '';

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
      setAuthError('Please fill out all fields.');
      return;
    }

    let registered = false;
    try {
      setAuthLoading(true);
      setAuthError('');

      await api.post('/api/auth/register', {
        full_name: cleanFullName,
        email: cleanEmail,
        password: cleanPassword
      });
      registered = true;

      // Automatically log user in after successful registration
      const formDataBody = new URLSearchParams();
      formDataBody.append('username', cleanEmail);
      formDataBody.append('password', cleanPassword);

      const res = await api.post('/api/auth/login', formDataBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const accessToken = res.data.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setIsAuthenticated(true);
      setRegisterForm({ fullName: '', email: '', password: '' });
      setIsRegistering(false);
    } catch (err) {
      console.error("Registration failed:", err);
      if (registered) {
        setIsRegistering(false);
        setLoginForm({ email: cleanEmail, password: cleanPassword });
        setAuthError('Account registered successfully! Please click Sign In.');
      } else {
        let errMsg = 'Unable to register. Please try again.';
        if (err.response?.status === 409 || err.response?.data?.detail === 'Email already registered') {
          errMsg = 'This email is already registered. Please switch to Sign In with your password.';
          setLoginForm((prev) => ({ ...prev, email: cleanEmail }));
        } else if (err.response?.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            errMsg = err.response.data.detail;
          } else if (Array.isArray(err.response.data.detail)) {
            errMsg = err.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
          }
        }
        setAuthError(errMsg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit complete onboarding profile to backend
  const handleOnboardingSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitStatusText('Initiating profile submission...');

    try {
      await submitOnboardingData(formData, setSubmitStatusText);
      setCurrentStep(11); // Success Screen
    } catch (err) {
      console.error("Submission failed:", err);
      const errMsg = err.response?.data?.detail || 'Unable to save your financial profile. Please try again.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
      setSubmitStatusText('');
    }
  };

  // Calculated values
  const totalIncome =
    Number(formData.income.monthlySalary || 0) +
    Number(formData.income.otherIncome || 0) +
    Number(formData.income.variableIncome || 0);

  const totalLoanEmi = formData.loans.reduce((acc, curr) => acc + Number(curr.emi || 0), 0) +
    (formData.housing.situation === 'Own House' && formData.housing.hasHomeLoan === 'Yes'
      ? Number(formData.housing.homeLoanEmi || 0)
      : 0);

  const totalEssentialExpenses = Object.values(formData.expenses.essential).reduce(
    (acc, curr) => acc + Number(curr || 0),
    0
  );

  const totalLifestyleExpenses = Object.values(formData.expenses.lifestyle).reduce(
    (acc, curr) => acc + Number(curr || 0),
    0
  );

  const totalExpenses = totalEssentialExpenses + totalLifestyleExpenses;
  const totalSavings = Number(formData.savings.bankSavings || 0) + Number(formData.savings.emergencyFund || 0);
  const totalExistingInvestments = formData.investments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Helper validation functions
  const validateNumber = (val, min = 0, name = 'value') => {
    if (val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return `${name} must be a number`;
    if (num < min) return `${name} cannot be negative`;
    return '';
  };

  const handleStepValidation = () => {
    const stepErrors = {};

    if (currentStep === 2) {
      const ageErr = validateNumber(formData.personal.age, 15, 'Age');
      if (ageErr) stepErrors.age = ageErr;
      else if (Number(formData.personal.age) > 100) stepErrors.age = 'Age cannot exceed 100';
      else if (!formData.personal.age) stepErrors.age = 'Age is required';

      if (!formData.personal.city) stepErrors.city = 'City is required';
      if (!formData.personal.employmentType) stepErrors.employmentType = 'Employment type is required';

      const familyMembersErr = validateNumber(formData.personal.familyMembers, 1, 'Family members');
      if (familyMembersErr) stepErrors.familyMembers = familyMembersErr;

      const dependentsErr = validateNumber(formData.personal.dependents, 0, 'Dependents');
      if (dependentsErr) stepErrors.dependents = dependentsErr;
      else if (Number(formData.personal.dependents) > Number(formData.personal.familyMembers || 0)) {
        stepErrors.dependents = 'Dependents cannot exceed family members';
      }
    }

    if (currentStep === 3) {
      const salaryErr = validateNumber(formData.income.monthlySalary, 0, 'Salary');
      if (salaryErr) stepErrors.monthlySalary = salaryErr;
      else if (formData.income.monthlySalary === '') stepErrors.monthlySalary = 'Monthly salary is required';

      const otherErr = validateNumber(formData.income.otherIncome, 0, 'Other income');
      if (otherErr) stepErrors.otherIncome = otherErr;

      const varErr = validateNumber(formData.income.variableIncome, 0, 'Variable income');
      if (varErr) stepErrors.variableIncome = varErr;
    }

    if (currentStep === 4) {
      if (!formData.housing.situation) {
        stepErrors.situation = 'Housing situation is required';
      } else {
        const situation = formData.housing.situation;
        if (situation === 'Rent') {
          const rentErr = validateNumber(formData.housing.rentAmount, 0, 'Rent amount');
          if (rentErr) stepErrors.rentAmount = rentErr;
          else if (formData.housing.rentAmount === '') stepErrors.rentAmount = 'Rent is required';

          const maintErr = validateNumber(formData.housing.maintenance, 0, 'Maintenance');
          if (maintErr) stepErrors.maintenance = maintErr;
        } else if (situation === 'Own House') {
          if (!formData.housing.hasHomeLoan) {
            stepErrors.hasHomeLoan = 'Please specify if you have a home loan';
          } else if (formData.housing.hasHomeLoan === 'Yes') {
            const emiErr = validateNumber(formData.housing.homeLoanEmi, 0, 'Home loan EMI');
            if (emiErr) stepErrors.homeLoanEmi = emiErr;
            else if (formData.housing.homeLoanEmi === '') stepErrors.homeLoanEmi = 'EMI amount is required';
          }
        } else if (situation === 'Living With Family') {
          const contribErr = validateNumber(formData.housing.householdContribution, 0, 'Contribution');
          if (contribErr) stepErrors.householdContribution = contribErr;
          const otherErr = validateNumber(formData.housing.otherHousingExpenses, 0, 'Other housing expenses');
          if (otherErr) stepErrors.otherHousingExpenses = otherErr;
        }
      }
    }

    if (currentStep === 5) {
      if (!formData.hasLoans) {
        stepErrors.hasLoans = 'Please specify if you have any loans';
      } else if (formData.hasLoans === 'Yes' && formData.loans.length === 0) {
        stepErrors.loansList = 'Please add at least one loan or select "No" above';
      }
    }

    if (currentStep === 6) {
      Object.keys(formData.expenses.essential).forEach((key) => {
        const val = formData.expenses.essential[key];
        const err = validateNumber(val, 0, key.replace(/([A-Z])/g, ' $1'));
        if (err) stepErrors[`essential_${key}`] = err;
      });

      Object.keys(formData.expenses.lifestyle).forEach((key) => {
        const val = formData.expenses.lifestyle[key];
        const err = validateNumber(val, 0, key.replace(/([A-Z])/g, ' $1'));
        if (err) stepErrors[`lifestyle_${key}`] = err;
      });
    }

    if (currentStep === 7) {
      const savErr = validateNumber(formData.savings.bankSavings, 0, 'Bank savings');
      if (savErr) stepErrors.bankSavings = savErr;
      const emgErr = validateNumber(formData.savings.emergencyFund, 0, 'Emergency fund');
      if (emgErr) stepErrors.emergencyFund = emgErr;
    }

    if (currentStep === 9) {
      if (!formData.investmentProfile.experience) stepErrors.experience = 'Experience level is required';
      if (!formData.investmentProfile.horizon) stepErrors.horizon = 'Time horizon is required';
      if (!formData.investmentProfile.riskTolerance) stepErrors.riskTolerance = 'Risk tolerance is required';
      if (!formData.investmentProfile.preference) stepErrors.preference = 'Primary preference is required';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (handleStepValidation()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDoubleNestedChange = (section, subSection, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value,
        },
      },
    }));
  };

  // Loans handlers
  const handleAddLoan = () => {
    const { type, outstandingAmount, emi, interestRate, tenure } = newLoan;

    if (!type || outstandingAmount === '' || emi === '' || interestRate === '' || tenure === '') {
      setLoanFormError('Please fill out all loan details');
      return;
    }

    if (Number(outstandingAmount) < 0 || Number(emi) < 0 || Number(interestRate) < 0 || Number(tenure) <= 0) {
      setLoanFormError('Invalid values. Tenure must be > 0 and others >= 0');
      return;
    }

    const loanObj = {
      id: crypto.randomUUID(), // Temp frontend ID, mapped during save
      type,
      outstandingAmount: Number(outstandingAmount),
      emi: Number(emi),
      interestRate: Number(interestRate),
      tenure: Number(tenure)
    };

    setFormData((prev) => ({
      ...prev,
      loans: [...prev.loans, loanObj]
    }));

    setNewLoan({
      type: '',
      outstandingAmount: '',
      emi: '',
      interestRate: '',
      tenure: ''
    });
    setLoanFormError('');
    setErrors((prev) => ({ ...prev, loansList: '' }));
  };

  const handleRemoveLoan = (id) => {
    setFormData((prev) => ({
      ...prev,
      loans: prev.loans.filter((loan) => loan.id !== id)
    }));
  };

  // Investments handlers
  const handleAddInvestment = () => {
    const { type, amount } = newInvestment;

    if (!type || amount === '') {
      setInvestmentFormError('Please select type and amount');
      return;
    }

    if (Number(amount) <= 0) {
      setInvestmentFormError('Investment amount must be greater than 0');
      return;
    }

    if (formData.investments.some((inv) => inv.type === type)) {
      setInvestmentFormError(`Already added amount for ${type}. Remove it first to modify.`);
      return;
    }

    const invObj = {
      id: crypto.randomUUID(),
      type,
      amount: Number(amount)
    };

    setFormData((prev) => ({
      ...prev,
      investments: [...prev.investments, invObj]
    }));

    setNewInvestment({ type: '', amount: '' });
    setInvestmentFormError('');
  };

  const handleRemoveInvestment = (id) => {
    setFormData((prev) => ({
      ...prev,
      investments: prev.investments.filter((inv) => inv.id !== id)
    }));
  };

  // Goals handlers
  const handleAddGoal = () => {
    const { name, targetAmount, currentSaved, targetDate } = newGoal;

    if (!name || targetAmount === '' || currentSaved === '' || !targetDate) {
      setGoalFormError('Please complete all goal fields');
      return;
    }

    if (Number(targetAmount) <= 0) {
      setGoalFormError('Target amount must be greater than 0');
      return;
    }

    if (Number(currentSaved) < 0) {
      setGoalFormError('Current saved amount cannot be negative');
      return;
    }

    if (Number(currentSaved) > Number(targetAmount)) {
      setGoalFormError('Current saved cannot exceed target amount');
      return;
    }

    const selectedDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setGoalFormError('Target date must be in the future');
      return;
    }

    const goalObj = {
      id: crypto.randomUUID(),
      name,
      targetAmount: Number(targetAmount),
      currentSaved: Number(currentSaved),
      targetDate
    };

    setFormData((prev) => ({
      ...prev,
      goals: [...prev.goals, goalObj]
    }));

    setNewGoal({ name: '', targetAmount: '', currentSaved: '', targetDate: '' });
    setGoalFormError('');
  };

  const handleRemoveGoal = (id) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/20">
              ₹
            </div>
            <span className="font-semibold text-slate-800 text-lg tracking-tight">Antigravity Money</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                  Logged in as <strong className="text-slate-700">{currentUser.full_name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg cursor-pointer bg-white"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            )}
            {!isAuthenticated && (
              <div className="text-xs text-slate-400 font-medium">Authentication Portal</div>
            )}
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {authLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-teal-600 mx-auto mb-4" size={36} />
            <p className="text-slate-500 text-sm font-semibold">Loading your financial portal...</p>
          </div>
        ) : !isAuthenticated ? (
          /* AUTHENTICATION PORTAL (Login & Register) */
          <div className="max-w-md w-full mx-auto bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-3 shadow-xs">
                <Lock size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {isRegistering ? 'Create a New Account' : 'Sign In to Your Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegistering
                  ? 'Register to build your personalized money management plan'
                  : 'Enter your credentials to manage your financial profile'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 text-xs font-semibold text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 p-3 rounded-xl">
                <AlertCircle size={15} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {isRegistering ? (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <FormInput
                  label="Full Name"
                  name="fullName"
                  placeholder="John Doe"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="demo@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer shadow-md shadow-teal-600/10 transition-colors text-sm"
                >
                  Register Account
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setAuthError('');
                    }}
                    className="text-teal-600 hover:text-teal-700 text-xs font-semibold cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="demo@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer shadow-md shadow-teal-600/10 transition-colors text-sm"
                >
                  Sign In
                </button>
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({
                        email: '717823i120@kce.ac.in',
                        password: 'Password123!'
                      });
                      setAuthError('');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl cursor-pointer text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ 1-Tap Fill: 717823i120@kce.ac.in (Password123!)</span>
                  </button>
                </div>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setAuthError('');
                    }}
                    className="text-teal-600 hover:text-teal-700 text-xs font-semibold cursor-pointer"
                  >
                    Don't have an account? Register
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : view === 'plan-ready' ? (
          <>
            {renderNavigationTabs('plan-ready')}
            <FinancialPlanReady 
              onNavigate={(v) => setView(v)} 
              onEditProfile={() => { setView('onboarding'); setCurrentStep(10); }} 
            />
          </>
        ) : view === 'dashboard' ? (
          <>
            {renderNavigationTabs('dashboard')}
            <FinancialDashboard
              onEditProfile={() => { setView('onboarding'); setCurrentStep(10); }}
              onNavigate={(v, goalId) => {
                if (goalId) {
                  setSelectedGoalId(goalId);
                }
                setView(v);
              }}
            />
          </>
        ) : view === 'plan' ? (
          <>
            {renderNavigationTabs('plan')}
            <FinancialPlan onEditProfile={() => { setView('onboarding'); setCurrentStep(10); }} />
          </>
        ) : view === 'expenses' ? (
          <>
            {renderNavigationTabs('expenses')}
            <ExpenseTracker />
          </>
        ) : view === 'goals' ? (
          <>
            {renderNavigationTabs('goals')}
            <GoalDetailsView initialSelectedGoalId={selectedGoalId} />
          </>
        ) : view === 'simulator' ? (
          <>
            {renderNavigationTabs('simulator')}
            <FinancialSimulator />
          </>
        ) : view === 'assistant' ? (
          <>
            {renderNavigationTabs('assistant')}
            <FinancialAssistant />
          </>
        ) : view === 'data-sources' ? (
          <>
            {renderNavigationTabs('data-sources')}
            <DataSourcesDashboard />
          </>
        ) : (
          /* AUTHENTICATED QUESTIONNAIRE FLOW */
          <>
            {formData && formData.personal && formData.personal.city && (
              renderNavigationTabs('onboarding')
            )}
            {currentStep > 1 && currentStep < 11 && (
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                  <span className="text-teal-600">Financial Profile</span>
                  <span>Step {currentStep - 1} of 8</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Dynamic Card Area */}
            <div className="premium-card premium-glow relative overflow-hidden bg-white shadow-xl shadow-slate-100/50">
              
              {/* Submission loading overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                  <Loader2 className="animate-spin text-teal-600 mb-4" size={42} />
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Saving Financial Profile</h3>
                  <p className="text-slate-500 text-sm font-medium animate-pulse">{submitStatusText}</p>
                </div>
              )}

              {submitError && (
                <div className="mb-4 text-xs font-semibold text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 p-3.5 rounded-xl">
                  <AlertCircle size={16} className="shrink-0" />
                  <div>
                    <strong className="block">Submission Error</strong>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {/* STEP 1: Introduction */}
              {currentStep === 1 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-6 shadow-xs">
                    <TrendingUp size={32} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
                    Let's Understand Your Finances
                  </h1>
                  <p className="text-slate-500 text-base max-w-lg mx-auto mb-8 leading-relaxed">
                    Answer a few questions about your income, expenses, savings, loans, and financial goals. We'll use this information later to create a personalized monthly money-management plan.
                  </p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/10 transition-all cursor-pointer"
                  >
                    Start My Financial Profile
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP 2: Personal Details */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="text-teal-500" size={22} />
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Age"
                      name="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.personal.age}
                      onChange={(e) => handleNestedChange('personal', 'age', e.target.value)}
                      error={errors.age}
                      required
                    />
                    <SearchableDropdown
                      label="City"
                      name="city"
                      options={CITIES}
                      value={formData.personal.city}
                      onChange={(e) => handleNestedChange('personal', 'city', e.target.value)}
                      error={errors.city}
                      required
                    />
                    <FormInput
                      label="Employment Type"
                      name="employmentType"
                      options={EMPLOYMENT_TYPES}
                      value={formData.personal.employmentType}
                      onChange={(e) => handleNestedChange('personal', 'employmentType', e.target.value)}
                      error={errors.employmentType}
                      required
                    />
                    <FormInput
                      label="Number of Family Members"
                      name="familyMembers"
                      type="number"
                      placeholder="Total family size"
                      value={formData.personal.familyMembers}
                      onChange={(e) => handleNestedChange('personal', 'familyMembers', e.target.value)}
                      error={errors.familyMembers}
                    />
                    <FormInput
                      label="Number of Dependents"
                      name="dependents"
                      type="number"
                      placeholder="Dependents relying on you"
                      value={formData.personal.dependents}
                      onChange={(e) => handleNestedChange('personal', 'dependents', e.target.value)}
                      error={errors.dependents}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Income */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase className="text-teal-500" size={22} />
                    Your Income
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="Monthly Salary"
                      name="monthlySalary"
                      type="number"
                      prefix="₹"
                      placeholder="0"
                      value={formData.income.monthlySalary}
                      onChange={(e) => handleNestedChange('income', 'monthlySalary', e.target.value)}
                      error={errors.monthlySalary}
                      required
                    />
                    <FormInput
                      label="Other Monthly Income"
                      name="otherIncome"
                      type="number"
                      prefix="₹"
                      placeholder="0"
                      value={formData.income.otherIncome}
                      onChange={(e) => handleNestedChange('income', 'otherIncome', e.target.value)}
                      error={errors.otherIncome}
                    />
                    <FormInput
                      label="Variable Income / Bonus"
                      name="variableIncome"
                      type="number"
                      prefix="₹"
                      placeholder="0"
                      value={formData.income.variableIncome}
                      onChange={(e) => handleNestedChange('income', 'variableIncome', e.target.value)}
                      error={errors.variableIncome}
                    />
                  </div>

                  <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Calculated Income
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        Salary + Other + Variable
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Monthly Income</span>
                      <span className="text-2xl font-bold text-teal-600">
                        ₹{totalIncome.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Housing */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Home className="text-teal-500" size={22} />
                    Your Housing Situation
                  </h2>
                  
                  <FormInput
                    label="What is your current housing situation?"
                    name="situation"
                    options={['Rent', 'Own House', 'Living With Family', 'Other']}
                    value={formData.housing.situation}
                    onChange={(e) => handleNestedChange('housing', 'situation', e.target.value)}
                    error={errors.situation}
                    required
                  />

                  {formData.housing.situation === 'Rent' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <FormInput
                        label="Monthly Rent"
                        name="rentAmount"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.housing.rentAmount}
                        onChange={(e) => handleNestedChange('housing', 'rentAmount', e.target.value)}
                        error={errors.rentAmount}
                        required
                      />
                      <FormInput
                        label="Maintenance Amount"
                        name="maintenance"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.housing.maintenance}
                        onChange={(e) => handleNestedChange('housing', 'maintenance', e.target.value)}
                        error={errors.maintenance}
                      />
                    </div>
                  )}

                  {formData.housing.situation === 'Own House' && (
                    <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <FormInput
                        label="Do you have a Home Loan?"
                        name="hasHomeLoan"
                        options={['Yes', 'No']}
                        value={formData.housing.hasHomeLoan}
                        onChange={(e) => handleNestedChange('housing', 'hasHomeLoan', e.target.value)}
                        error={errors.hasHomeLoan}
                        required
                      />
                      {formData.housing.hasHomeLoan === 'Yes' && (
                        <div className="mt-3">
                          <FormInput
                            label="Home Loan EMI"
                            name="homeLoanEmi"
                            type="number"
                            prefix="₹"
                            placeholder="0"
                            value={formData.housing.homeLoanEmi}
                            onChange={(e) => handleNestedChange('housing', 'homeLoanEmi', e.target.value)}
                            error={errors.homeLoanEmi}
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {formData.housing.situation === 'Living With Family' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <FormInput
                        label="Monthly Contribution to Household"
                        name="householdContribution"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.housing.householdContribution}
                        onChange={(e) => handleNestedChange('housing', 'householdContribution', e.target.value)}
                        error={errors.householdContribution}
                      />
                      <FormInput
                        label="Other Housing Expenses"
                        name="otherHousingExpenses"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.housing.otherHousingExpenses}
                        onChange={(e) => handleNestedChange('housing', 'otherHousingExpenses', e.target.value)}
                        error={errors.otherHousingExpenses}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Loans */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="text-teal-500" size={22} />
                    Your Loans
                  </h2>

                  <FormInput
                    label="Do you currently have any loans?"
                    name="hasLoans"
                    options={['Yes', 'No']}
                    value={formData.hasLoans}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        hasLoans: val,
                        loans: val === 'No' ? [] : prev.loans
                      }));
                      setErrors((prev) => ({ ...prev, hasLoans: '', loansList: '' }));
                    }}
                    error={errors.hasLoans}
                    required
                  />

                  {formData.hasLoans === 'Yes' && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <h3 className="font-semibold text-slate-700 text-sm mb-3">Add Loan Information</h3>
                      
                      {loanFormError && (
                        <div className="mb-4 text-xs font-semibold text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                          <AlertCircle size={14} />
                          {loanFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <FormInput
                          label="Loan Type"
                          name="type"
                          options={['Education Loan', 'Home Loan', 'Personal Loan', 'Vehicle Loan', 'Credit Card Debt', 'Other']}
                          value={newLoan.type}
                          onChange={(e) => setNewLoan((prev) => ({ ...prev, type: e.target.value }))}
                        />
                        <FormInput
                          label="Outstanding Amount"
                          name="outstanding"
                          type="number"
                          prefix="₹"
                          placeholder="0"
                          value={newLoan.outstandingAmount}
                          onChange={(e) => setNewLoan((prev) => ({ ...prev, outstandingAmount: e.target.value }))}
                        />
                        <FormInput
                          label="Monthly EMI"
                          name="emi"
                          type="number"
                          prefix="₹"
                          placeholder="0"
                          value={newLoan.emi}
                          onChange={(e) => setNewLoan((prev) => ({ ...prev, emi: e.target.value }))}
                        />
                        <FormInput
                          label="Interest Rate"
                          name="rate"
                          type="number"
                          suffix="%"
                          placeholder="0"
                          value={newLoan.interestRate}
                          onChange={(e) => setNewLoan((prev) => ({ ...prev, interestRate: e.target.value }))}
                        />
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <FormInput
                              label="Remaining Tenure"
                              name="tenure"
                              type="number"
                              suffix="M"
                              placeholder="Months"
                              value={newLoan.tenure}
                              onChange={(e) => setNewLoan((prev) => ({ ...prev, tenure: e.target.value }))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddLoan}
                            className="mb-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg p-2.5 flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      {errors.loansList && (
                        <p className="mt-2 text-xs text-red-500 font-semibold">{errors.loansList}</p>
                      )}

                      {formData.loans.length > 0 && (
                        <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse text-xs md:text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="p-3">Type</th>
                                <th className="p-3">Outstanding</th>
                                <th className="p-3">EMI</th>
                                <th className="p-3">Interest</th>
                                <th className="p-3">Tenure</th>
                                <th className="p-3 w-12"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                              {formData.loans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-slate-50/50">
                                  <td className="p-3">{loan.type}</td>
                                  <td className="p-3">₹{Number(loan.outstandingAmount || 0).toLocaleString('en-IN')}</td>
                                  <td className="p-3">₹{Number(loan.emi || 0).toLocaleString('en-IN')}</td>
                                  <td className="p-3">{loan.interestRate}%</td>
                                  <td className="p-3">{loan.tenure} Months</td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLoan(loan.id)}
                                      className="text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: Monthly Expenses */}
              {currentStep === 6 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet className="text-teal-500" size={22} />
                    Your Monthly Expenses
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Essential Expenses</span>
                        <span className="text-teal-600 font-semibold text-xs bg-teal-50 px-2 py-0.5 rounded-full">
                          ₹{totalEssentialExpenses.toLocaleString('en-IN')}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {Object.keys(formData.expenses.essential).map((key) => {
                          const label = key === 'foodGroceries' ? 'Food & Groceries' : key.charAt(0).toUpperCase() + key.slice(1);
                          return (
                            <FormInput
                              key={key}
                              label={label}
                              name={key}
                              type="number"
                              prefix="₹"
                              placeholder="0"
                              value={formData.expenses.essential[key]}
                              onChange={(e) => handleDoubleNestedChange('expenses', 'essential', key, e.target.value)}
                              error={errors[`essential_${key}`]}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Lifestyle Expenses</span>
                        <span className="text-teal-600 font-semibold text-xs bg-teal-50 px-2 py-0.5 rounded-full">
                          ₹{totalLifestyleExpenses.toLocaleString('en-IN')}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {Object.keys(formData.expenses.lifestyle).map((key) => {
                          const label = key === 'eatingOutside' ? 'Eating Outside' : key.charAt(0).toUpperCase() + key.slice(1);
                          return (
                            <FormInput
                              key={key}
                              label={label}
                              name={key}
                              type="number"
                              prefix="₹"
                              placeholder="0"
                              value={formData.expenses.lifestyle[key]}
                              onChange={(e) => handleDoubleNestedChange('expenses', 'lifestyle', key, e.target.value)}
                              error={errors[`lifestyle_${key}`]}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <div className="flex justify-between items-center md:block">
                      <span className="md:block">Essential Expenses</span>
                      <span className="text-slate-700 text-sm font-bold block md:mt-1">
                        ₹{totalEssentialExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center md:block border-t border-slate-200 md:border-t-0 md:border-l md:pl-6 pt-2 md:pt-0">
                      <span className="md:block">Lifestyle Expenses</span>
                      <span className="text-slate-700 text-sm font-bold block md:mt-1">
                        ₹{totalLifestyleExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center md:block border-t border-slate-200 md:border-t-0 md:border-l md:pl-6 pt-2 md:pt-0 bg-teal-50/50 -m-4 p-4 rounded-b-xl md:rounded-r-xl md:rounded-b-none md:text-right">
                      <span className="text-teal-600 md:block">Total Expenses</span>
                      <span className="text-teal-700 text-xl font-extrabold block md:mt-0.5">
                        ₹{totalExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Savings & Investments */}
              {currentStep === 7 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-teal-500" size={22} />
                    Your Current Financial Position
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2">Savings</h3>
                      <FormInput
                        label="Bank Savings"
                        name="bankSavings"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.savings.bankSavings}
                        onChange={(e) => handleNestedChange('savings', 'bankSavings', e.target.value)}
                        error={errors.bankSavings}
                      />
                      <FormInput
                        label="Emergency Fund"
                        name="emergencyFund"
                        type="number"
                        prefix="₹"
                        placeholder="0"
                        value={formData.savings.emergencyFund}
                        onChange={(e) => handleNestedChange('savings', 'emergencyFund', e.target.value)}
                        error={errors.emergencyFund}
                      />
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Total Savings</span>
                        <span className="text-teal-600 text-sm">₹{totalSavings.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2">Existing Investments</h3>
                      
                      {investmentFormError && (
                        <div className="mb-4 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                          {investmentFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <FormInput
                          label="Investment Type"
                          name="type"
                          options={INVESTMENT_TYPES}
                          value={newInvestment.type}
                          onChange={(e) => setNewInvestment((prev) => ({ ...prev, type: e.target.value }))}
                        />
                        <FormInput
                          label="Investment Amount"
                          name="amount"
                          type="number"
                          prefix="₹"
                          placeholder="0"
                          value={newInvestment.amount}
                          onChange={(e) => setNewInvestment((prev) => ({ ...prev, amount: e.target.value }))}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddInvestment}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus size={16} />
                        Add Investment
                      </button>

                      {formData.investments.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                          {formData.investments.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg text-xs"
                            >
                              <span className="text-slate-600 font-semibold">{inv.type}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-teal-600 font-bold">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvestment(inv.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Total Investments</span>
                        <span className="text-teal-600 text-sm">₹{totalExistingInvestments.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Financial Goals */}
              {currentStep === 8 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="text-teal-500" size={22} />
                    Your Financial Goals
                  </h2>

                  {goalFormError && (
                    <div className="mb-4 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                      {goalFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-end">
                    <div className="md:col-span-1">
                      <FormInput
                        label="Goal Category"
                        name="name"
                        options={GOAL_TYPES}
                        value={newGoal.name}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <FormInput
                      label="Target Amount"
                      name="target"
                      type="number"
                      prefix="₹"
                      placeholder="0"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, targetAmount: e.target.value }))}
                    />
                    <FormInput
                      label="Current Saved"
                      name="saved"
                      type="number"
                      prefix="₹"
                      placeholder="0"
                      value={newGoal.currentSaved}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, currentSaved: e.target.value }))}
                    />
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <FormInput
                          label="Target Date"
                          name="date"
                          type="month"
                          value={newGoal.targetDate}
                          onChange={(e) => setNewGoal((prev) => ({ ...prev, targetDate: e.target.value }))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddGoal}
                        className="mb-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg p-2.5 flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {formData.goals.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.goals.map((g) => {
                        const remaining = g.targetAmount - g.currentSaved;
                        const percent = Math.min(100, Math.round((g.currentSaved / g.targetAmount) * 100));
                        return (
                          <div key={g.id} className="border border-slate-100 hover:border-teal-500/20 p-4 rounded-xl shadow-xs bg-white relative flex flex-col justify-between">
                            <button
                              type="button"
                              onClick={() => handleRemoveGoal(g.id)}
                              className="absolute top-3 right-3 text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div>
                              <div className="text-slate-800 font-bold text-sm pr-6">{g.name}</div>
                              <div className="text-slate-400 text-xs font-semibold mt-0.5">Target: {g.targetDate}</div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-400 uppercase">
                              <div>
                                <span className="block text-[10px]">Target</span>
                                <span className="text-slate-700 font-bold">₹{Number(g.targetAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="block text-[10px]">Saved</span>
                                <span className="text-teal-600 font-bold">₹{Number(g.currentSaved || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="block text-[10px]">Remaining</span>
                                <span className="text-slate-700 font-bold">₹{remaining.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                                <span>Goal progress</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50">
                      No financial goals added yet. Add one above!
                    </div>
                  )}
                </div>
              )}

              {/* STEP 9: Investment Profile */}
              {currentStep === 9 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="text-teal-500" size={22} />
                    Understand Your Investment Preferences
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Investment Experience"
                      name="experience"
                      options={['No Experience', 'Beginner', 'Intermediate', 'Experienced']}
                      value={formData.investmentProfile.experience}
                      onChange={(e) => handleNestedChange('investmentProfile', 'experience', e.target.value)}
                      error={errors.experience}
                      required
                    />
                    <FormInput
                      label="Investment Time Horizon"
                      name="horizon"
                      options={['Less than 1 year', '1–3 years', '3–5 years', '5+ years']}
                      value={formData.investmentProfile.horizon}
                      onChange={(e) => handleNestedChange('investmentProfile', 'horizon', e.target.value)}
                      error={errors.horizon}
                      required
                    />
                    <FormInput
                      label="Risk Tolerance"
                      name="riskTolerance"
                      options={['Low', 'Medium', 'High']}
                      value={formData.investmentProfile.riskTolerance}
                      onChange={(e) => handleNestedChange('investmentProfile', 'riskTolerance', e.target.value)}
                      error={errors.riskTolerance}
                      required
                    />
                    <FormInput
                      label="Primary Financial Preference"
                      name="preference"
                      options={['Capital Preservation', 'Balanced Growth', 'Long-Term Growth']}
                      value={formData.investmentProfile.preference}
                      onChange={(e) => handleNestedChange('investmentProfile', 'preference', e.target.value)}
                      error={errors.preference}
                      required
                    />
                  </div>

                  <div className="mt-6 border border-slate-100 bg-slate-50 p-4 rounded-xl flex items-start gap-2.5">
                    <HelpCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      <strong>Disclaimer:</strong> Your answers will be used later to understand your financial preferences. This application does not currently provide personalized investment advice or recommend individual securities.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 10: Review Step */}
              {currentStep === 10 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="text-teal-500" size={24} />
                    Review Your Financial Profile
                  </h2>

                  <div className="space-y-6">
                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Personal Information</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Age</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.personal.age || '—'} years</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">City</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.personal.city || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Employment</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.personal.employmentType || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Family Size</span>
                          <span className="text-slate-700 font-bold text-sm">
                            {formData.personal.familyMembers || '—'} ({formData.personal.dependents || '0'} dependents)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Monthly Income</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Salary</span>
                          <span className="text-slate-700 font-bold text-sm">₹{Number(formData.income.monthlySalary || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Other Income</span>
                          <span className="text-slate-700 font-bold text-sm">₹{Number(formData.income.otherIncome || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Variable / Bonus</span>
                          <span className="text-slate-700 font-bold text-sm">₹{Number(formData.income.variableIncome || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-teal-50 px-2 py-1 rounded-lg">
                          <span className="text-teal-600 font-semibold block uppercase tracking-wider text-[9px]">Total Income</span>
                          <span className="text-teal-700 font-extrabold text-sm">₹{totalIncome.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Housing situation</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="text-xs">
                        <p className="text-slate-700 font-bold mb-2">Housing Situation: <span className="text-teal-600">{formData.housing.situation || '—'}</span></p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.housing.situation === 'Rent' && (
                            <>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Rent</span>
                                <span className="text-slate-700 font-bold text-sm">₹{Number(formData.housing.rentAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Maintenance</span>
                                <span className="text-slate-700 font-bold text-sm">₹{Number(formData.housing.maintenance || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </>
                          )}
                          {formData.housing.situation === 'Own House' && (
                            <>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Home Loan Status</span>
                                <span className="text-slate-700 font-bold text-sm">{formData.housing.hasHomeLoan || '—'}</span>
                              </div>
                              {formData.housing.hasHomeLoan === 'Yes' && (
                                <div>
                                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Home Loan EMI</span>
                                  <span className="text-slate-700 font-bold text-sm">₹{Number(formData.housing.homeLoanEmi || 0).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </>
                          )}
                          {formData.housing.situation === 'Living With Family' && (
                            <>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Household Contribution</span>
                                <span className="text-slate-700 font-bold text-sm">₹{Number(formData.housing.householdContribution || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Other Housing Expenses</span>
                                <span className="text-slate-700 font-bold text-sm">₹{Number(formData.housing.otherHousingExpenses || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Loans</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(5)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      {formData.hasLoans === 'Yes' && formData.loans.length > 0 ? (
                        <div className="space-y-2">
                          {formData.loans.map((loan) => (
                            <div key={loan.id} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-2 rounded-lg text-xs">
                              <div>
                                <span className="text-slate-700 font-bold block">{loan.type}</span>
                                <span className="text-slate-400 font-semibold mt-0.5">Rate: {loan.interestRate}% | Tenure: {loan.tenure} months</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-500 font-bold block">EMI: ₹{Number(loan.emi || 0).toLocaleString('en-IN')}</span>
                                <span className="text-slate-400 font-semibold text-[10px]">O/S: ₹{Number(loan.outstandingAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">No loans declared.</p>
                      )}
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Monthly Expenses</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(6)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center uppercase tracking-wider font-semibold text-slate-400">
                        <div className="bg-white border border-slate-100 p-2.5 rounded-lg">
                          <span className="text-[10px]">Essential</span>
                          <span className="text-slate-700 font-extrabold text-sm block mt-0.5">₹{totalEssentialExpenses.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white border border-slate-100 p-2.5 rounded-lg">
                          <span className="text-[10px]">Lifestyle</span>
                          <span className="text-slate-700 font-extrabold text-sm block mt-0.5">₹{totalLifestyleExpenses.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-lg">
                          <span className="text-teal-600 text-[10px]">Total Expenses</span>
                          <span className="text-teal-700 font-extrabold text-sm block mt-0.5">₹{totalExpenses.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Savings & Investments</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(7)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Savings</p>
                          <div className="bg-white border border-slate-100 p-3 rounded-lg flex justify-between font-semibold">
                            <span className="text-slate-500">Bank + Emergency:</span>
                            <span className="text-teal-600 font-bold">₹{totalSavings.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Investments</p>
                          <div className="bg-white border border-slate-100 p-3 rounded-lg flex justify-between font-semibold">
                            <span className="text-slate-500">Declared Assets ({formData.investments.length}):</span>
                            <span className="text-teal-600 font-bold">₹{totalExistingInvestments.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Financial Goals</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(8)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      {formData.goals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {formData.goals.map((g) => (
                            <div key={g.id} className="bg-white border border-slate-100 px-3 py-2.5 rounded-lg text-xs flex justify-between items-center">
                              <div>
                                <span className="text-slate-700 font-bold block">{g.name}</span>
                                <span className="text-slate-400 font-semibold text-[10px]">Target date: {g.targetDate}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-teal-600 font-extrabold block">Saved: ₹{Number(g.currentSaved || 0).toLocaleString('en-IN')}</span>
                                <span className="text-slate-400 font-semibold text-[10px]">Target: ₹{Number(g.targetAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">No financial goals declared.</p>
                      )}
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 text-sm">Investment Profile</h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(9)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Experience</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.investmentProfile.experience || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Horizon</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.investmentProfile.horizon || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Risk Tolerance</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.investmentProfile.riskTolerance || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Preference</span>
                          <span className="text-slate-700 font-bold text-sm">{formData.investmentProfile.preference || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 11: Success screen */}
              {currentStep === 11 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-6">
                    <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
                    Profile Setup Completed!
                  </h1>
                  <div className="inline-block bg-teal-50 text-teal-700 font-semibold px-4 py-2 rounded-xl text-sm border border-teal-100 mb-6">
                    Financial profile completed successfully.
                  </div>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto mb-8 font-medium">
                    Your onboarding profile has been securely saved to the database. You can return to this questionnaire anytime to edit your responses.
                  </p>
                  <button
                    onClick={() => setView('plan-ready')}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-teal-600/10"
                  >
                    View My Financial Action Plan
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Navigation Area */}
              {currentStep > 1 && currentStep < 11 && (
                <div className="mt-8 border-t border-slate-100 pt-6 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={currentStep === 10 ? handleOnboardingSubmit : handleNext}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/10 text-sm"
                  >
                    {currentStep === 10 ? 'Complete Financial Profile' : 'Next'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} Antigravity Money. All rights reserved.
      </footer>
    </div>
  );
}
