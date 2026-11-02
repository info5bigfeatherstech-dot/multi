import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  adminDropshipperApi,
  AdminDropshipperRequest,
  AdminDropshipperAccount,
  AdminDropshipperSettings,
} from "../api";

export interface AdminDropshipperState {
  settings: AdminDropshipperSettings | null;
  settingsLoading: boolean;
  requests: AdminDropshipperRequest[];
  requestsTotal: number;
  requestsLoading: boolean;
  selectedRequest: AdminDropshipperRequest | null;
  accounts: AdminDropshipperAccount[];
  accountsTotal: number;
  accountsLoading: boolean;
  selectedAccount: AdminDropshipperAccount | null;
  accountDetailsLoading: boolean;
  orders: any[];
  ordersTotal: number;
  ordersLoading: boolean;
  selectedOrder: any | null;
  actionLoading: boolean;
  error: string | null;
}

const initialState: AdminDropshipperState = {
  settings: null,
  settingsLoading: false,
  requests: [],
  requestsTotal: 0,
  requestsLoading: false,
  selectedRequest: null,
  accounts: [],
  accountsTotal: 0,
  accountsLoading: false,
  selectedAccount: null,
  accountDetailsLoading: false,
  orders: [],
  ordersTotal: 0,
  ordersLoading: false,
  selectedOrder: null,
  actionLoading: false,
  error: null,
};

// 1. Settings
export const fetchAdminDropshipperSettings = createAsyncThunk(
  "adminDropshipper/fetchAdminDropshipperSettings",
  async (_, { rejectWithValue }) => {
    try {
      return await adminDropshipperApi.getSettings();
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load dropshipper settings");
    }
  }
);

export const updateAdminDropshipperSettings = createAsyncThunk(
  "adminDropshipper/updateAdminDropshipperSettings",
  async (payload: Partial<AdminDropshipperSettings>, { rejectWithValue }) => {
    try {
      return await adminDropshipperApi.updateSettings(payload);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update settings");
    }
  }
);

// 2. KYC Requests
export const fetchAdminDropshipperRequests = createAsyncThunk(
  "adminDropshipper/fetchAdminDropshipperRequests",
  async (
    params: {
      page?: number;
      limit?: number;
      adminStatus?: string;
      kind?: string;
      search?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      return await adminDropshipperApi.getRequests(params);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load requests");
    }
  }
);

export const approveAdminDropshipperRequest = createAsyncThunk(
  "adminDropshipper/approveAdminDropshipperRequest",
  async ({ id, note }: { id: string; note?: string }, { rejectWithValue }) => {
    try {
      await adminDropshipperApi.approveRequest(id, note);
      return { id, status: "approved" };
    } catch (err: any) {
      return rejectWithValue(err.message || "Approval failed");
    }
  }
);

export const rejectAdminDropshipperRequest = createAsyncThunk(
  "adminDropshipper/rejectAdminDropshipperRequest",
  async ({ id, note }: { id: string; note: string }, { rejectWithValue }) => {
    try {
      await adminDropshipperApi.rejectRequest(id, note);
      return { id, status: "rejected", note };
    } catch (err: any) {
      return rejectWithValue(err.message || "Rejection failed");
    }
  }
);

// 3. Accounts
export const fetchAdminDropshipperAccounts = createAsyncThunk(
  "adminDropshipper/fetchAdminDropshipperAccounts",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      q?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      return await adminDropshipperApi.getAccounts(params);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load accounts");
    }
  }
);

export const fetchAdminDropshipperAccountDetail = createAsyncThunk(
  "adminDropshipper/fetchAdminDropshipperAccountDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await adminDropshipperApi.getAccountDetails(id);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load account details");
    }
  }
);

// 4. Orders
export const fetchAdminDropshipperOrders = createAsyncThunk(
  "adminDropshipper/fetchAdminDropshipperOrders",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      dropshipperId?: string;
      q?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      return await adminDropshipperApi.getOrders(params);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load dropship orders");
    }
  }
);

// 5. Product Dropship Pricing
export const setVariantDropshipPrice = createAsyncThunk(
  "adminDropshipper/setVariantDropshipPrice",
  async (
    {
      slug,
      productCode,
      dropshipBase,
      enable,
    }: {
      slug: string;
      productCode: string;
      dropshipBase: number;
      enable?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminDropshipperApi.setVariantPrice(slug, productCode, {
        dropshipBase,
        enable,
      });
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update dropship price");
    }
  }
);

export const toggleVariantDropshipListing = createAsyncThunk(
  "adminDropshipper/toggleVariantDropshipListing",
  async (
    {
      slug,
      productCode,
      enable,
      clearPrice,
    }: {
      slug: string;
      productCode: string;
      enable: boolean;
      clearPrice?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      if (enable) {
        return await adminDropshipperApi.enableVariant(slug, productCode);
      } else {
        return await adminDropshipperApi.disableVariant(slug, productCode, clearPrice);
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update listing status");
    }
  }
);

export const adminDropshipperSlice = createSlice({
  name: "adminDropshipper",
  initialState,
  reducers: {
    setSelectedRequest: (state, action: PayloadAction<AdminDropshipperRequest | null>) => {
      state.selectedRequest = action.payload;
    },
    setSelectedAccount: (state, action: PayloadAction<AdminDropshipperAccount | null>) => {
      state.selectedAccount = action.payload;
    },
    setSelectedAdminOrder: (state, action: PayloadAction<any | null>) => {
      state.selectedOrder = action.payload;
    },
    clearAdminDropshipperError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Settings
    builder
      .addCase(fetchAdminDropshipperSettings.pending, (state) => {
        state.settingsLoading = true;
      })
      .addCase(fetchAdminDropshipperSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchAdminDropshipperSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateAdminDropshipperSettings.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAdminDropshipperSettings.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateAdminDropshipperSettings.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Requests
    builder
      .addCase(fetchAdminDropshipperRequests.pending, (state) => {
        state.requestsLoading = true;
      })
      .addCase(fetchAdminDropshipperRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.requests = payload;
          state.requestsTotal = payload.length;
        } else if (payload?.requests) {
          state.requests = payload.requests;
          state.requestsTotal = payload.total || payload.requests.length;
        }
      })
      .addCase(fetchAdminDropshipperRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.error = action.payload as string;
      });

    // Approve
    builder
      .addCase(approveAdminDropshipperRequest.fulfilled, (state, action) => {
        const item = state.requests.find((r) => r._id === action.payload.id || r.id === action.payload.id);
        if (item) {
          item.adminStatus = "approved";
        }
        if (state.selectedRequest && (state.selectedRequest._id === action.payload.id || state.selectedRequest.id === action.payload.id)) {
          state.selectedRequest.adminStatus = "approved";
        }
      });

    // Reject
    builder
      .addCase(rejectAdminDropshipperRequest.fulfilled, (state, action) => {
        const item = state.requests.find((r) => r._id === action.payload.id || r.id === action.payload.id);
        if (item) {
          item.adminStatus = "rejected";
          item.adminNote = action.payload.note;
        }
        if (state.selectedRequest && (state.selectedRequest._id === action.payload.id || state.selectedRequest.id === action.payload.id)) {
          state.selectedRequest.adminStatus = "rejected";
          state.selectedRequest.adminNote = action.payload.note;
        }
      });

    // Accounts
    builder
      .addCase(fetchAdminDropshipperAccounts.pending, (state) => {
        state.accountsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDropshipperAccounts.fulfilled, (state, action) => {
        state.accountsLoading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.accounts = payload;
          state.accountsTotal = payload.length;
        } else if (payload?.dropshippers) {
          state.accounts = Array.isArray(payload.dropshippers) ? payload.dropshippers : [];
          state.accountsTotal = payload.total ?? state.accounts.length;
        } else if (payload?.accounts) {
          state.accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
          state.accountsTotal = payload.total ?? state.accounts.length;
        } else if (payload?.data?.dropshippers) {
          state.accounts = Array.isArray(payload.data.dropshippers) ? payload.data.dropshippers : [];
          state.accountsTotal = payload.data.total ?? state.accounts.length;
        } else if (payload?.data?.accounts) {
          state.accounts = Array.isArray(payload.data.accounts) ? payload.data.accounts : [];
          state.accountsTotal = payload.data.total ?? state.accounts.length;
        } else if (Array.isArray(payload?.data)) {
          state.accounts = payload.data;
          state.accountsTotal = payload.total ?? payload.data.length;
        } else {
          state.accounts = [];
          state.accountsTotal = 0;
        }
      })
      .addCase(fetchAdminDropshipperAccounts.rejected, (state, action) => {
        state.accountsLoading = false;
        state.error = action.payload as string;
      });

    // Account Details
    builder
      .addCase(fetchAdminDropshipperAccountDetail.pending, (state) => {
        state.accountDetailsLoading = true;
      })
      .addCase(fetchAdminDropshipperAccountDetail.fulfilled, (state, action) => {
        state.accountDetailsLoading = false;
        const payload = action.payload as any;
        state.selectedAccount = payload?.dropshipper || payload?.account || payload?.data || action.payload;
      })
      .addCase(fetchAdminDropshipperAccountDetail.rejected, (state, action) => {
        state.accountDetailsLoading = false;
        state.error = action.payload as string;
      });

    // Orders
    builder
      .addCase(fetchAdminDropshipperOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchAdminDropshipperOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.orders = payload;
          state.ordersTotal = payload.length;
        } else if (payload?.orders) {
          state.orders = payload.orders;
          state.ordersTotal = payload.total || payload.orders.length;
        }
      })
      .addCase(fetchAdminDropshipperOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedRequest,
  setSelectedAccount,
  setSelectedAdminOrder,
  clearAdminDropshipperError,
} = adminDropshipperSlice.actions;

export default adminDropshipperSlice.reducer;

