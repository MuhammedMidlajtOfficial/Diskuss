import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['INV', 'ENT', 'EMP'],
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
