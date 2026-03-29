import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
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
  category: string;
  description: string;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  receiptDataUri?: string;
  fraudStatus?: 'CLEAR' | 'SUSPICIOUS';
  fraudReason?: string;
  currentStepIndex: number;
  history: ExpenseHistory[];
}

export interface ApprovalStep {
  id: string;
  name: string;
  approverRole: UserRole;
}

interface ReimburseFlowStore {
  currentUser: User | null;
  users: User[];
  expenses: Expense[];
  workflow: ApprovalStep[];
  
  setCurrentUser: (user: User | null) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'currentStepIndex' | 'history'>) => void;
  updateExpenseStatus: (id: string, userId: string, status: ExpenseStatus, comment?: string) => void;
  setWorkflow: (steps: ApprovalStep[]) => void;
}

const initialUsers: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@company.com', role: 'ADMIN' },
  { id: '2', name: 'Bob Manager', email: 'bob@company.com', role: 'MANAGER' },
  { id: '3', name: 'Charlie Finance', email: 'charlie@company.com', role: 'FINANCE' },
  { id: '4', name: 'David Employee', email: 'david@company.com', role: 'EMPLOYEE', managerId: '2' },
];

const initialWorkflow: ApprovalStep[] = [
  { id: 's1', name: 'Manager Review', approverRole: 'MANAGER' },
  { id: 's2', name: 'Finance Audit', approverRole: 'FINANCE' },
];

export const useStore = create<ReimburseFlowStore>((set) => ({
  currentUser: initialUsers[3], // Default to David Employee for demo
  users: initialUsers,
  expenses: [],
  workflow: initialWorkflow,

  setCurrentUser: (user) => set({ currentUser: user }),

  addExpense: (expenseData) => set((state) => ({
    expenses: [
      {
        ...expenseData,
        id: Math.random().toString(36).substr(2, 9),
        currentStepIndex: 0,
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

  updateExpenseStatus: (id, userId, status, comment) => set((state) => {
    const user = state.users.find(u => u.id === userId);
    return {
      expenses: state.expenses.map((exp) => {
        if (exp.id !== id) return exp;
        
        const isApproving = status === 'APPROVED';
        const isRejecting = status === 'REJECTED';
        const nextStepIndex = isApproving ? exp.currentStepIndex + 1 : exp.currentStepIndex;
        const finalStatus = isRejecting ? 'REJECTED' : (nextStepIndex >= state.workflow.length ? 'APPROVED' : 'PENDING');

        return {
          ...exp,
          status: finalStatus,
          currentStepIndex: nextStepIndex,
          history: [
            ...exp.history,
            {
              id: Math.random().toString(36).substr(2, 9),
              userId,
              userName: user?.name || 'Unknown',
              action: isRejecting ? 'REJECTED' : 'APPROVED',
              comment,
              date: new Date().toISOString(),
            },
          ],
        };
      }),
    };
  }),

  setWorkflow: (workflow) => set({ workflow }),
}));