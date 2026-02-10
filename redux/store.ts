import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authSliceReducer from '@/redux/slice/auth-mgt/auth-mgt-slice';
import estateSliceReducer from '@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt-slice';
import superAdminUserSliceReducer from '@/redux/slice/super-admin/super-admin-user/super-admin-user-slice';
import fieldSliceReducer from '@/redux/slice/admin/address-mgt/fields/fields-slice';
import entrySliceReducer from '@/redux/slice/admin/address-mgt/entry/entry-slice';
import adminUserSliceReducer from '@/redux/slice/admin/user-mgt/user-slice';
import billSliceReducer from '@/redux/slice/admin/bills-mgt/bills-slice';
import residentBillSliceReducer from '@/redux/slice/resident/bill-mgt/bills-mgt-slice';
import walletSliceReducer from '@/redux/slice/resident/wallet-mgt/wallet-mgt-slice';
import estateAdminWalletSliceReducer from '@/redux/slice/estate-admin/wallet-mgt/wallet-mgt-slice';
import transactionSliceReducer from '@/redux/slice/resident/transaction/transaction-slice';
import estateAdminTransactionSliceReducer from '@/redux/slice/estate-admin/transaction/transaction-slice';
import fundWalletSliceReducer from '@/redux/slice/estate-admin/fund-wallet/fund-wallet-slice';
import adminMeterSliceReducer from '@/redux/slice/admin/meter-mgt/meter-mgt-slice';
import residentMeterSliceReducer from '@/redux/slice/resident/meter-mgt/meter-mgt-slice';
import superAdminMeterSliceReducer from '@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter-slice';
import visitorSliceReducer from '@/redux/slice/admin/visitor/visitor.slice';
import residentVisitorSliceReducer from '@/redux/slice/resident/visitor/visitor-slice';
import paymentSliceReducer from '@/redux/slice/estate-admin/payment/paymentSlice';


const persistConfig = {
    key: 'root',
    storage,
};



const persistedAuthReducer = persistReducer(persistConfig, authSliceReducer);
const persistedEstateReducer = persistReducer(persistConfig, estateSliceReducer);
const persistedSuperAdminUserReducer = persistReducer(persistConfig, superAdminUserSliceReducer);
const persistedFieldReducer = persistReducer(persistConfig, fieldSliceReducer);
const persistedEntryReducer = persistReducer(persistConfig, entrySliceReducer);
const persistedAdminUserReducer = persistReducer(persistConfig, adminUserSliceReducer);
const persistedBillReducer = persistReducer(persistConfig, billSliceReducer);
const persistedResidentBillReducer = persistReducer(persistConfig, residentBillSliceReducer);
const persistedWalletSliceReducer = persistReducer(persistConfig, walletSliceReducer);
const persistedEstateAdminWalletSliceReducer = persistReducer(persistConfig, estateAdminWalletSliceReducer);
const persistedTransactionSliceReducer = persistReducer(persistConfig, transactionSliceReducer);
const persistedEstateAdminTransactionSliceReducer = persistReducer(persistConfig, estateAdminTransactionSliceReducer);
const persistedFundWalletSliceReducer = persistReducer(persistConfig, fundWalletSliceReducer);
const persistedAdminMeterliceReducer = persistReducer(persistConfig, adminMeterSliceReducer);
const persistedResidentMeterliceReducer = persistReducer(persistConfig, residentMeterSliceReducer);
const persistedSuperAdmintMeterliceReducer = persistReducer(persistConfig, superAdminMeterSliceReducer);
const persistedVisitorSliceReducer = persistReducer(persistConfig, visitorSliceReducer);
const persistedResidentVisitorSliceReducer = persistReducer(persistConfig, residentVisitorSliceReducer);
const persistedPaymentSliceReducer = persistReducer(persistConfig, paymentSliceReducer);


export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
        estate: persistedEstateReducer,
        superAdminUser: persistedSuperAdminUserReducer,
        adminField: persistedFieldReducer,
        adminEntry: persistedEntryReducer,
        adminUser: persistedAdminUserReducer,
        adminBill: persistedBillReducer,
        residentBill: persistedResidentBillReducer,
        wallet: persistedWalletSliceReducer,
        estateAdminWallet: persistedEstateAdminWalletSliceReducer,
        residentTransaction: persistedTransactionSliceReducer,
        estateAdminTransaction: persistedEstateAdminTransactionSliceReducer,
        estateAdminFundWallet: persistedFundWalletSliceReducer,
        adminMeter: persistedAdminMeterliceReducer,
        residentMeter: persistedResidentMeterliceReducer,
        superAdminMeter: persistedSuperAdmintMeterliceReducer,
        visitor: persistedVisitorSliceReducer,
        residentVisitor: persistedResidentVisitorSliceReducer,
        payment: persistedPaymentSliceReducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);