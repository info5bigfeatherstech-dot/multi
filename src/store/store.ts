import { configureStore } from '@reduxjs/toolkit';
import adminProductsReducer from './adminProductsSlice';
import reviewsReducer from './reviewsSlice';
import adminDropshipperReducer from './adminDropshipperSlice';

export const store = configureStore({
  reducer: {
    adminProducts: adminProductsReducer,
    reviews: reviewsReducer,
    adminDropshipper: adminDropshipperReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
