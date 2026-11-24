const fs = require('fs');
let code = fs.readFileSync('scratch_prev_dash.jsx', 'utf8');

// Replace unsafe split on item.category
code = code.replace(
  /{item\.category\.split\(' '\)\[0\]}/g,
  "{(item.category || item.label || 'Asset').split(' ')[0]}"
);

// Replace allocation.allocations.map with (safeAllocation?.allocations || []).map
code = code.replace(
  /\{allocation\.allocations\.map\(/g,
  "{(safeAllocation?.allocations || []).map("
);

// Replace if (!plan || !allocation) return null;
code = code.replace(
  'if (!plan || !allocation) return null;',
  `const safeAllocation = allocation || {
    investment_capacity: 0,
    allocation_status: 'paused',
    allocations: [],
    disclaimer: 'Investment suggestions are for educational guidance.'
  };
  if (!plan) return null;`
);

// Replace allocation.disclaimer with safeAllocation?.disclaimer
code = code.replace(
  'allocation.disclaimer',
  "safeAllocation?.disclaimer || 'Investment suggestions are for educational guidance.'"
);

// Replace allocation.profile with safeAllocation?.profile
code = code.replace(
  'allocation.profile',
  '(safeAllocation?.profile || {})'
);

// Replace allocation.allocation_status with safeAllocation?.allocation_status
code = code.replace(
  'allocation.allocation_status',
  'safeAllocation?.allocation_status'
);

fs.writeFileSync('src/components/dashboard/FinancialDashboard.jsx', code, 'utf8');
console.log('Restored previous FinancialDashboard cleanly with null-safety!');
