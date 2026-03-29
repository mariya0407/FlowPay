import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR';

export interface Company {
  id: string;
  name: string;
  base_currency: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
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
  file_url: string; 
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
  is_manager_step?: boolean;
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
  updateCompany: (updates: Partial<Company>) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'status'>, receiptDataUri?: string) => void;
  updateApprovalStatus: (expenseId: string, approverId: string, status: ExpenseStatus, comment?: string) => void;
  updateWorkflow: (rule: ApprovalRule, approvers: Omit<RuleApprover, 'id' | 'rule_id'>[]) => void;
}

const initialCompany: Company = { 
  id: 'c1', 
  name: 'Nexus Enterprise Solutions', 
  base_currency: 'USD', 
  created_at: new Date().toISOString() 
};

const initialUsers: User[] = [
  // C-Suite / Root
  { id: 'u1', name: 'Alex Sterling', email: 'alex.s@nexus.com', role: 'ADMIN', company_id: 'c1', created_at: new Date().toISOString() },
  { id: 'u2', name: 'Diana Thorne', email: 'diana.t@nexus.com', role: 'DIRECTOR', company_id: 'c1', created_at: new Date().toISOString() },
  
  // Finance Dept (Reporting to Director)
  { id: 'u3', name: 'Frank Miller', email: 'frank.m@nexus.com', role: 'FINANCE', company_id: 'c1', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 'u11', name: 'Sarah Vance', email: 'sarah.v@nexus.com', role: 'FINANCE', company_id: 'c1', manager_id: 'u3', created_at: new Date().toISOString() },
  
  // Sales Dept (Reporting to Director)
  { id: 'u4', name: 'Marcus Chen', email: 'marcus.c@nexus.com', role: 'MANAGER', company_id: 'c1', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 'u7', name: 'Alice Cooper', email: 'alice.c@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u4', created_at: new Date().toISOString() },
  { id: 'u12', name: 'Oscar Wilde', email: 'oscar.w@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u4', created_at: new Date().toISOString() },
  
  // Operations Dept (Reporting to Director)
  { id: 'u5', name: 'James Holden', email: 'james.h@nexus.com', role: 'MANAGER', company_id: 'c1', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 'u8', name: 'Bob Belcher', email: 'bob.b@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u5', created_at: new Date().toISOString() },
  { id: 'u9', name: 'Charlie Day', email: 'charlie.d@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u5', created_at: new Date().toISOString() },
  { id: 'u10', name: 'Eve Polastri', email: 'eve.p@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u5', created_at: new Date().toISOString() },
  
  // IT / Infrastructure
  { id: 'u13', name: 'Kevin Flynn', email: 'kevin.f@nexus.com', role: 'MANAGER', company_id: 'c1', manager_id: 'u1', created_at: new Date().toISOString() },
  { id: 'u14', name: 'Quorra', email: 'quorra@nexus.com', role: 'EMPLOYEE', company_id: 'c1', manager_id: 'u13', created_at: new Date().toISOString() },
];

const initialRule: ApprovalRule = {
  id: 'r1',
  company_id: 'c1',
  name: 'Nexus Master Protocol',
  is_manager_approver: true,
  min_approval_percentage: 100,
  created_at: new Date().toISOString(),
};

const initialApprovers: RuleApprover[] = [
  { id: 'ra1', rule_id: 'r1', approver_id: 'u3', step_order: 1 },
  { id: 'ra2', rule_id: 'r1', approver_id: 'u2', step_order: 2 },
];

export const useStore = create<ReimburseFlowStore>((set) => ({
  company: initialCompany,
  currentUser: initialUsers[0],
  users: initialUsers,
  expenses: [],
  receipts: [],
  approvalRules: [initialRule],
  ruleApprovers: initialApprovers,
  expenseApprovals: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  
  updateCompany: (updates) => set((state) => ({
    company: { ...state.company, ...updates }
  })),

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

    const rule = state.approvalRules.find(r => r.id === expenseData.rule_id);
    const submitter = state.users.find(u => u.id === expenseData.user_id);
    const initialApprovals: ExpenseApproval[] = [];
    let currentOrder = 1;

    if (rule?.is_manager_approver && submitter?.manager_id) {
      initialApprovals.push({
        id: Math.random().toString(36).substr(2, 9),
        expense_id: expenseId,
        approver_id: submitter.manager_id,
        step_order: currentOrder++,
        status: 'PENDING',
        is_manager_step: true
      });
    }

    const configuredApprovers = state.ruleApprovers
      .filter(ra => ra.rule_id === expenseData.rule_id)
      .sort((a, b) => a.step_order - b.step_order);

    configuredApprovers.forEach(ra => {
      if (initialApprovals.some(a => a.approver_id === ra.approver_id)) return;
      
      initialApprovals.push({
        id: Math.random().toString(36).substr(2, 9),
        expense_id: expenseId,
        approver_id: ra.approver_id,
        step_order: currentOrder++,
        status: 'PENDING',
      });
    });

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

    const expense = state.expenses.find(e => e.id === expenseId);
    const rule = state.approvalRules.find(r => r.id === expense?.rule_id);
    const allApprovalsForThisExpense = updatedApprovals.filter(ea => ea.expense_id === expenseId);
    
    const isRejected = status === 'REJECTED';
    const approvedCount = allApprovalsForThisExpense.filter(ea => ea.status === 'APPROVED').length;
    const totalSteps = allApprovalsForThisExpense.length;
    const approvalPercentage = totalSteps > 0 ? (approvedCount / totalSteps) * 100 : 0;
    
    const meetsPercentage = approvalPercentage >= (rule?.min_approval_percentage || 100);
    const specialApproverActed = allApprovalsForThisExpense.find(ea => ea.approver_id === rule?.special_approver_id);
    const specialApproved = specialApproverActed?.status === 'APPROVED';
    
    const isFullyApproved = (approvedCount === totalSteps) || meetsPercentage || specialApproved;

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
}));
