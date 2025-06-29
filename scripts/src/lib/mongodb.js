"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.default = connectDB;
exports.generateTransactionReference = generateTransactionReference;
// src/lib/mongodb.ts
var mongoose_1 = require("mongoose");
var User_1 = require("@/models/User");
// Hardcoded MongoDB connection string
var MONGODB_URI = 'mongodb+srv://sarahmorganme2844:WWznuJXRceASUfa4@justimagine.pvtpi05.mongodb.net/?retryWrites=true&w=majority&appName=Justimagine';
var cached = global._mongoose || { conn: null, promise: null };
function connectDB() {
    return __awaiter(this, void 0, void 0, function () {
        var opts, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (cached.conn)
                        return [2 /*return*/, cached.conn];
                    if (!cached.promise) {
                        opts = { bufferCommands: false, autoIndex: process.env.NODE_ENV !== 'production' };
                        cached.promise = mongoose_1.default
                            .connect(MONGODB_URI, opts)
                            .then(function (m) { console.log('✅ MongoDB connected'); return m; })
                            .catch(function (err) { cached.promise = null; console.error('❌ MongoDB connection error:', err); throw err; });
                    }
                    _a = cached;
                    return [4 /*yield*/, cached.promise];
                case 1:
                    _a.conn = _b.sent();
                    return [2 /*return*/, cached.conn];
            }
        });
    });
}
function generateTransactionReference(prefix) {
    if (prefix === void 0) { prefix = 'txn'; }
    return "".concat(prefix, "-").concat(Date.now(), "-").concat(Math.floor(Math.random() * 1000));
}
exports.db = {
    getUserById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, User_1.default.findById(id).select('-password -__v')];
                }
            });
        });
    },
    getUserByEmail: function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, User_1.default.findOne({ email: email }).select('-password -__v')];
                }
            });
        });
    },
    verifyUser: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, User_1.default.findByIdAndUpdate(userId, { verified: true }, { new: true }).select('-password -__v')];
                    case 2:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User not found');
                        return [2 /*return*/, user];
                }
            });
        });
    },
    deleteUser: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, User_1.default.findByIdAndDelete(userId).select('-password -__v')];
                    case 2:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User not found');
                        return [2 /*return*/, user];
                }
            });
        });
    },
    getUsers: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, User_1.default.find({}).select('-password -__v').sort({ createdAt: -1 })];
                }
            });
        });
    },
    createTransaction: function (userId_1, transactionData_1) {
        return __awaiter(this, arguments, void 0, function (userId, transactionData, initialStatus) {
            var session, user, newBalance, transaction, error_1;
            if (initialStatus === void 0) { initialStatus = 'completed'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, mongoose_1.default.startSession()];
                    case 2:
                        session = _a.sent();
                        session.startTransaction();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, 9, 10]);
                        return [4 /*yield*/, User_1.default.findById(userId).session(session)];
                    case 4:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User not found');
                        newBalance = user.balance;
                        if (transactionData.type === 'deposit' || transactionData.type === 'credit') {
                            newBalance += transactionData.amount;
                        }
                        else {
                            newBalance -= transactionData.amount;
                            if (newBalance < 0)
                                throw new Error('Insufficient funds');
                        }
                        transaction = __assign(__assign({}, transactionData), { date: new Date(), balanceAfter: newBalance, status: initialStatus, reference: generateTransactionReference(), currency: transactionData.currency || 'USD' });
                        user.balance = newBalance;
                        user.transactions.push(transaction);
                        return [4 /*yield*/, user.save({ session: session })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, session.commitTransaction()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, { user: user, transaction: transaction }];
                    case 7:
                        error_1 = _a.sent();
                        return [4 /*yield*/, session.abortTransaction()];
                    case 8:
                        _a.sent();
                        throw error_1;
                    case 9:
                        session.endSession();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    },
    updateTransactionStatus: function (userId, transactionReference, newStatus) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, User_1.default.findOneAndUpdate({ _id: userId, 'transactions.reference': transactionReference }, { $set: { 'transactions.$.status': newStatus } }, { new: true })];
                    case 2:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User or transaction not found');
                        // ← explicit `ITransaction` to avoid implicit-any
                        return [2 /*return*/, user.transactions.find(function (t) { return t.reference === transactionReference; })];
                }
            });
        });
    },
    getTransactions: function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, options) {
            var _a, limit, _b, page, status, type, startDate, endDate, query, filter, user;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, connectDB()];
                    case 1:
                        _c.sent();
                        _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b, status = options.status, type = options.type, startDate = options.startDate, endDate = options.endDate;
                        query = User_1.default.findById(userId).select('transactions');
                        filter = {};
                        if (status)
                            filter['transactions.status'] = status;
                        if (type)
                            filter['transactions.type'] = type;
                        if (startDate || endDate) {
                            filter['transactions.date'] = {};
                            if (startDate)
                                filter['transactions.date'].$gte = startDate;
                            if (endDate)
                                filter['transactions.date'].$lte = endDate;
                        }
                        if (Object.keys(filter).length)
                            query = query.where(filter);
                        return [4 /*yield*/, query.slice('transactions', [(page - 1) * limit, limit]).sort({ 'transactions.date': -1 })];
                    case 2:
                        user = _c.sent();
                        if (!user)
                            throw new Error('User not found');
                        return [2 /*return*/, user.transactions];
                }
            });
        });
    },
    createBitcoinTransaction: function (userId_1, transactionData_1) {
        return __awaiter(this, arguments, void 0, function (userId, transactionData, initialStatus) {
            var session, user, newBalance, transaction, error_2;
            if (initialStatus === void 0) { initialStatus = 'completed'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // same logic as createTransaction but for btcBalance...
                    return [4 /*yield*/, connectDB()];
                    case 1:
                        // same logic as createTransaction but for btcBalance...
                        _a.sent();
                        return [4 /*yield*/, mongoose_1.default.startSession()];
                    case 2:
                        session = _a.sent();
                        session.startTransaction();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, 9, 10]);
                        return [4 /*yield*/, User_1.default.findById(userId).session(session)];
                    case 4:
                        user = _a.sent();
                        if (!user)
                            throw new Error('User not found');
                        newBalance = user.btcBalance;
                        if (transactionData.type === 'deposit' || transactionData.type === 'credit') {
                            newBalance += transactionData.amount;
                        }
                        else {
                            newBalance -= transactionData.amount;
                            if (newBalance < 0)
                                throw new Error('Insufficient Bitcoin balance');
                        }
                        transaction = __assign(__assign({}, transactionData), { date: new Date(), balanceAfter: newBalance, status: initialStatus, reference: generateTransactionReference('btc'), currency: 'BTC' });
                        user.btcBalance = newBalance;
                        user.transactions.push(transaction);
                        return [4 /*yield*/, user.save({ session: session })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, session.commitTransaction()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, { user: user, transaction: transaction }];
                    case 7:
                        error_2 = _a.sent();
                        return [4 /*yield*/, session.abortTransaction()];
                    case 8:
                        _a.sent();
                        throw error_2;
                    case 9:
                        session.endSession();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    }
};
// Connection event logs
mongoose_1.default.connection.on('connected', function () { return console.log('🟢 Mongoose connected'); });
mongoose_1.default.connection.on('error', function (err) { return console.error('🔴 Mongoose connection error:', err); });
mongoose_1.default.connection.on('disconnected', function () { return console.log('🟡 Mongoose disconnected'); });
