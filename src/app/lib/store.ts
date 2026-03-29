import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  avatar?: string;
}

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface ExpenseHistory {
  id: string;
  userId: string;
  userName: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMMENTED';
  comment?: string;
  date: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  exchangeRate: number;
  category: string;
  description: string;
  date: string;
  status: ExpenseStatus;
  receiptDataUri?: string;
  currentStepIndex: number;
  history: ExpenseHistory[];
  approvalsInCurrentStep: string[]; // IDs of users who approved in current step
}

export interface ApprovalStep {
  id: string;
  name: string;
  approverRole: UserRole;
  isRequired: boolean;
  minApprovalPercentage: number; // For future multi-approver expansion
}

interface ReimburseFlowStore {
  currentUser: User | null;
  users: User[];
  expenses: Expense[];
  workflow: ApprovalStep[];
  baseCurrency: string;
  
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'currentStepIndex' | 'history' | 'approvalsInCurrentStep'>) => void;
  updateExpenseStatus: (id: string, userId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
  setWorkflow: (steps: ApprovalStep[]) => void;
  setBaseCurrency: (currency: string) => void;
}

const initialUsers: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@company.com', role: 'ADMIN' },
  { id: '2', name: 'Bob Manager', email: 'bob@company.com', role: 'MANAGER' },
  { id: '3', name: 'Charlie Finance', email: 'charlie@company.com', role: 'FINANCE' },
  { id: '4', name: 'David Employee', email: 'david@company.com', role: 'EMPLOYEE', managerId: '2' },
];

const initialWorkflow: ApprovalStep[] = [
  { id: 's1', name: 'Manager Review', approverRole: 'MANAGER', isRequired: true, minApprovalPercentage: 100 },
  { id: 's2', name: 'Finance Audit', approverRole: 'FINANCE', isRequired: true, minApprovalPercentage: 100 },
];

export const useStore = create<ReimburseFlowStore>((set) => ({
  currentUser: initialUsers[3],
  users: initialUsers,
  expenses: [],
  workflow: initialWorkflow,
  baseCurrency: 'USD',

  setCurrentUser: (user) => set({ currentUser: user }),
  
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  
  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
  })),

  addExpense: (expenseData) => set((state) => ({
    expenses: [
      {
        ...expenseData,
        id: Math.random().toString(36).substr(2, 9),
        currentStepIndex: 0,
        approvalsInCurrentStep: [],
        history: [{
          id: Math.random().toString(36).substr(2, 9),
          userId: expenseData.employeeId,
          userName: expenseData.employeeName,
          action: 'SUBMITTED',
          date: new Date().toISOString(),
        }],
      },
      ...state.expenses,
    ],
  })),

  updateExpenseStatus: (id, userId, action, comment) => set((state) => {
    const user = state.users.find(u => u.id === userId);
    const expense = state.expenses.find(e => e.id === id);
    if (!expense || !user) return state;

    const isRejecting = action === 'REJECTED';
    
    // Logic for moving to next step
    // In this simplified version, one approval from the correct role moves it forward
    // unless we implement the multi-approver percentage rule fully.
    const isLastStep = expense.currentStepIndex >= state.workflow.length - 1;
    const nextStepIndex = !isRejecting ? expense.currentStepIndex + 1 : expense.currentStepIndex;
    const finalStatus = isRejecting ? 'REJECTED' : (isLastStep ? 'APPROVED' : 'PENDING');

    return {
      expenses: state.expenses.map((exp) => {
        if (exp.id !== id) return exp;
        return {
          ...exp,
          status: finalStatus,
          currentStepIndex: nextStepIndex,
          history: [
            ...exp.history,
            {
              id: Math.random().toString(36).substr(2, 9),
              userId,
              userName: user.name,
              action: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
              comment,
              date: new Date().toISOString(),
            },
          ],
        };
      }),
    };
  }),

  setWorkflow: (workflow) => set({ workflow }),
  setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
}));
