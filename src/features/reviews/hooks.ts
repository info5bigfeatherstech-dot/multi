import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProductReviews,
  fetchMyProductReview,
  fetchProductReviewEligibility,
  submitProductReview,
  ProductReviewsBundle,
} from '../../store/reviewsSlice';
import { isAuthenticated } from '../../utils/authGuard';

export type { ProductReviewsBundle };

export function useProductReviews(productId?: string) {
  const dispatch = useAppDispatch();
  const reviewState = useAppSelector((state) => (productId ? state.reviews.byProduct[productId] : undefined));

  useEffect(() => {
    if (productId && !reviewState) {
      dispatch(fetchProductReviews(productId));
    }
  }, [dispatch, productId, reviewState]);

  const refetch = useCallback(() => {
    if (productId) {
      return dispatch(fetchProductReviews(productId));
    }
  }, [dispatch, productId]);

  return {
    data: reviewState || { summary: null, reviews: [] },
    isLoading: reviewState ? reviewState.isLoading : Boolean(productId),
    refetch,
  };
}

export function useMyProductReview(productId?: string) {
  const dispatch = useAppDispatch();
  const isAuth = typeof window !== 'undefined' ? (isAuthenticated() || Boolean(localStorage.getItem('user_access_token'))) : false;
  const myReviewEntry = useAppSelector((state) => (productId ? state.reviews.myReviews[productId] : undefined));

  useEffect(() => {
    if (productId && isAuth && !myReviewEntry) {
      dispatch(fetchMyProductReview(productId));
    }
  }, [dispatch, productId, isAuth, myReviewEntry]);

  return {
    data: myReviewEntry?.data || null,
    isLoading: myReviewEntry?.isLoading || false,
  };
}

export function useProductReviewEligibility(productId?: string) {
  const dispatch = useAppDispatch();
  const isAuth = typeof window !== 'undefined' ? (isAuthenticated() || Boolean(localStorage.getItem('user_access_token'))) : false;
  const eligibilityEntry = useAppSelector((state) => (productId ? state.reviews.eligibility[productId] : undefined));

  useEffect(() => {
    if (productId && isAuth && !eligibilityEntry) {
      dispatch(fetchProductReviewEligibility(productId));
    }
  }, [dispatch, productId, isAuth, eligibilityEntry]);

  return {
    data: eligibilityEntry?.data || null,
    isLoading: eligibilityEntry?.isLoading || false,
  };
}

export function useSubmitProductReview(productId: string) {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector((state) => state.reviews.isSubmitting);
  const submitError = useAppSelector((state) => state.reviews.submitError);

  const mutateAsync = useCallback(
    async (payload: {
      rating: number;
      comment?: string;
      orderId?: string;
      images?: File[];
    }) => {
      const res = await dispatch(
        submitProductReview({
          productId,
          rating: payload.rating,
          comment: payload.comment,
          orderId: payload.orderId,
          images: payload.images,
        })
      ).unwrap();
      return res;
    },
    [dispatch, productId]
  );

  return {
    mutateAsync,
    isPending: isSubmitting,
    isLoading: isSubmitting,
    error: submitError,
  };
}
