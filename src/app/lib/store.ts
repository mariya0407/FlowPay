import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Company {
  id: string;
  name: string;
  base_currency: string;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  manager_id?: string;
  created_at: string;
}

export interface ApprovalRule {
  id: string;
  company_id: string;
  name: string;
  is_manager_approver: boolean;
  min_approval_percentage: number;
  special_approver_id?: string;
  created_at: string;
}

export interface RuleApprover {
  id: string;
  rule_id: string;
  approver_id: string;
  step_order: number;
}

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Expense {
  id: string;
  user_id: string;
  company_id: string;
  rule_id: string;
  amount: number;
  currency: string;
  converted_amount: number;
  category: string;
  description: string;
  expense_date: string;
  status: ExpenseStatus;
  created_at: string;
}

export interface Receipt {
  id: string;
  expense_id: string;
  file_url: string; // Used for the data URI in this MVP
  ocr_data?: any;
  created_at: string;
}

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  approver_id: string;
  step_order: number;
  status: ExpenseStatus;
  comments?: string;
  acted_at?: string;
}

interface ReimburseFlowStore {
  company: Company;
  currentUser: User | null;
  users: User[];
  expenses: Expense[];
  receipts: Receipt[];
  approvalRules: ApprovalRule[];
  ruleApprovers: RuleApprover[];
  expenseApprovals: ExpenseApproval[];
  
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'status'>, receiptDataUri?: string) => void;
  updateApprovalStatus: (expenseId: string, approverId: string, status: ExpenseStatus, comment?: string) => void;
  updateWorkflow: (rule: ApprovalRule, approvers: Omit<RuleApprover, 'id' | 'rule_id'>[]) => void;
  setBaseCurrency: (currency: string) => void;
}

const initialCompany: Company = {
  id: 'c1',
  name: 'Global Corp',
  base_currency: 'USD',
  created_at: new Date().toISOString(),
};

const initialUsers: User[] = [
  { id: 'u1', company_id: 'c1', name: 'Alice Admin', email: 'alice@company.com', role: 'ADMIN', created_at: new Date().toISOString() },
  { id: 'u2', company_id: 'c1', name: 'Bob Manager', email: 'bob@company.com', role: 'MANAGER', created_at: new Date().toISOString() },
  { id: 'u3', company_id: 'c1', name: 'David Employee', email: 'david@company.com', role: 'EMPLOYEE', manager_id: 'u2', created_at: new Date().toISOString() },
];

const initialRule: ApprovalRule = {
  id: 'r1',
  company_id: 'c1',
  name: 'Standard Approval',
  is_manager_approver: true,
  min_approval_percentage: 100,
  created_at: new Date().toISOString(),
};

const initialApprovers: RuleApprover[] = [
  { id: 'ra1', rule_id: 'r1', approver_id: 'u2', step_order: 1 },
  { id: 'ra2', rule_id: 'r1', approver_id: 'u1', step_order: 2 },
];

export const useStore = create<ReimburseFlowStore>((set) => ({
  company: initialCompany,
  currentUser: initialUsers[2],
  users: initialUsers,
  expenses: [],
  receipts: [],
  approvalRules: [initialRule],
  ruleApprovers: initialApprovers,
  expenseApprovals: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  
  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
  })),

  addExpense: (expenseData, receiptDataUri) => set((state) => {
    const expenseId = Math.random().toString(36).substr(2, 9);
    const newExpense: Expense = {
      ...expenseData,
      id: expenseId,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const newReceipt: Receipt | null = receiptDataUri ? {
      id: Math.random().toString(36).substr(2, 9),
      expense_id: expenseId,
      file_url: receiptDataUri,
      created_at: new Date().toISOString(),
    } : null;

    // Create initial pending approvals based on current rule
    const ruleApprovers = state.ruleApprovers.filter(ra => ra.rule_id === expenseData.rule_id);
    const initialApprovals: ExpenseApproval[] = ruleApprovers.map(ra => ({
      id: Math.random().toString(36).substr(2, 9),
      expense_id: expenseId,
      approver_id: ra.approver_id,
      step_order: ra.step_order,
      status: 'PENDING',
    }));

    return {
      expenses: [newExpense, ...state.expenses],
      receipts: newReceipt ? [newReceipt, ...state.receipts] : state.receipts,
      expenseApprovals: [...initialApprovals, ...state.expenseApprovals],
    };
  }),

  updateApprovalStatus: (expenseId, approverId, status, comment) => set((state) => {
    const updatedApprovals = state.expenseApprovals.map(ea => 
      (ea.expense_id === expenseId && ea.approver_id === approverId)
        ? { ...ea, status, comments: comment, acted_at: new Date().toISOString() }
        : ea
    );

    // Check if the whole expense is now fully approved or rejected
    const expenseApprovals = updatedApprovals.filter(ea => ea.expense_id === expenseId);
    const isRejected = expenseApprovals.some(ea => ea.status === 'REJECTED');
    const isFullyApproved = expenseApprovals.every(ea => ea.status === 'APPROVED');

    let finalStatus: ExpenseStatus = 'PENDING';
    if (isRejected) finalStatus = 'REJECTED';
    else if (isFullyApproved) finalStatus = 'APPROVED';

    return {
      expenseApprovals: updatedApprovals,
      expenses: state.expenses.map(e => e.id === expenseId ? { ...e, status: finalStatus } : e)
    };
  }),

  updateWorkflow: (rule, approvers) => set((state) => ({
    approvalRules: state.approvalRules.map(r => r.id === rule.id ? rule : r),
    ruleApprovers: [
      ...state.ruleApprovers.filter(ra => ra.rule_id !== rule.id),
      ...approvers.map(a => ({ ...a, id: Math.random().toString(36).substr(2, 9), rule_id: rule.id }))
    ]
  })),

  setBaseCurrency: (currency) => set((state) => ({
    company: { ...state.company, base_currency: currency }
  })),
}));
