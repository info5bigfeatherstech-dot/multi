import { configureStore } from '@reduxjs/toolkit';
import adminProductsReducer from './adminProductsSlice';

export const store = configureStore({
  reducer: {
    adminProducts: adminProductsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
