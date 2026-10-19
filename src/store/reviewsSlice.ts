import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  storefrontReviewsApi,
  PublicReviewItem,
  ProductReviewSummaryData,
  ReviewEligibilityData,
} from '../api';

export interface ProductReviewsBundle {
  summary: ProductReviewSummaryData | null;
  reviews: PublicReviewItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

export interface ReviewsState {
  byProduct: Record<string, ProductReviewsBundle>;
  myReviews: Record<string, { data: PublicReviewItem | null; isLoading: boolean }>;
  eligibility: Record<string, { data: ReviewEligibilityData | null; isLoading: boolean }>;
  isSubmitting: boolean;
  submitError: string | null;
}

const initialState: ReviewsState = {
  byProduct: {},
  myReviews: {},
  eligibility: {},
  isSubmitting: false,
  submitError: null,
};

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (productId: string, { rejectWithValue }) => {
    if (!productId) {
      return { productId: '', summary: null, reviews: [] };
    }
    try {
      const [summary, listRes] = await Promise.all([
        storefrontReviewsApi.getSummary(productId).catch(() => null),
        storefrontReviewsApi.list(productId, { page: 1, limit: 50 }).catch(() => ({ reviews: [] })),
      ]);

      const rawReviews = (listRes as any)?.reviews || (Array.isArray(listRes) ? listRes : []);
      const pagination = (listRes as any)?.pagination;

      return {
        productId,
        summary,
        reviews: Array.isArray(rawReviews) ? rawReviews : [],
        pagination,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load reviews');
    }
  }
);

export const fetchMyProductReview = createAsyncThunk(
  'reviews/fetchMyProductReview',
  async (productId: string) => {
    if (!productId) return { productId: '', data: null };
    try {
      const data = await storefrontReviewsApi.getMine(productId);
      return { productId, data };
    } catch {
      return { productId, data: null };
    }
  }
);

export const fetchProductReviewEligibility = createAsyncThunk(
  'reviews/fetchProductReviewEligibility',
  async (productId: string) => {
    if (!productId) return { productId: '', data: null };
    try {
      const data = await storefrontReviewsApi.getEligibility(productId);
      return { productId, data };
    } catch {
      return { productId, data: null };
    }
  }
);

export const submitProductReview = createAsyncThunk(
  'reviews/submitProductReview',
  async (
    payload: {
      productId: string;
      rating: number;
      comment?: string;
      orderId?: string;
      images?: File[];
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const result = await storefrontReviewsApi.submitReview(payload);
      // Invalidate and refresh store review state for this product
      dispatch(fetchProductReviews(payload.productId));
      dispatch(fetchMyProductReview(payload.productId));
      dispatch(fetchProductReviewEligibility(payload.productId));
      return result;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to submit review');
    }
  }
);

export const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearProductReviews: (state, action: PayloadAction<string>) => {
      delete state.byProduct[action.payload];
      delete state.myReviews[action.payload];
      delete state.eligibility[action.payload];
    },
  },
  extraReducers: (builder) => {
    // 1. fetchProductReviews
    builder
      .addCase(fetchProductReviews.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        if (!state.byProduct[productId]) {
          state.byProduct[productId] = {
            summary: null,
            reviews: [],
            isLoading: true,
            error: null,
          };
        } else {
          state.byProduct[productId].isLoading = true;
          state.byProduct[productId].error = null;
        }
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        const { productId, summary, reviews, pagination } = action.payload;
        if (!productId) return;
        state.byProduct[productId] = {
          summary,
          reviews,
          pagination,
          isLoading: false,
          error: null,
        };
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        if (state.byProduct[productId]) {
          state.byProduct[productId].isLoading = false;
          state.byProduct[productId].error = (action.payload as string) || 'Failed to load reviews';
        }
      });

    // 2. fetchMyProductReview
    builder
      .addCase(fetchMyProductReview.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        state.myReviews[productId] = {
          data: state.myReviews[productId]?.data || null,
          isLoading: true,
        };
      })
      .addCase(fetchMyProductReview.fulfilled, (state, action) => {
        const { productId, data } = action.payload;
        if (!productId) return;
        state.myReviews[productId] = {
          data,
          isLoading: false,
        };
      })
      .addCase(fetchMyProductReview.rejected, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        state.myReviews[productId] = {
          data: null,
          isLoading: false,
        };
      });

    // 3. fetchProductReviewEligibility
    builder
      .addCase(fetchProductReviewEligibility.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        state.eligibility[productId] = {
          data: state.eligibility[productId]?.data || null,
          isLoading: true,
        };
      })
      .addCase(fetchProductReviewEligibility.fulfilled, (state, action) => {
        const { productId, data } = action.payload;
        if (!productId) return;
        state.eligibility[productId] = {
          data,
          isLoading: false,
        };
      })
      .addCase(fetchProductReviewEligibility.rejected, (state, action) => {
        const productId = action.meta.arg;
        if (!productId) return;
        state.eligibility[productId] = {
          data: null,
          isLoading: false,
        };
      });

    // 4. submitProductReview
    builder
      .addCase(submitProductReview.pending, (state) => {
        state.isSubmitting = true;
        state.submitError = null;
      })
      .addCase(submitProductReview.fulfilled, (state) => {
        state.isSubmitting = false;
        state.submitError = null;
      })
      .addCase(submitProductReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submitError = (action.payload as string) || 'Failed to submit review';
      });
  },
});

export const { clearProductReviews } = reviewsSlice.actions;
export default reviewsSlice.reducer;
