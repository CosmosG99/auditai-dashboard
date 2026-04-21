import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  audit_event: {
    id: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now },
    input_type: { type: String },
    source_file: { type: String },
    extraction: { type: mongoose.Schema.Types.Mixed },
    detection: { type: mongoose.Schema.Types.Mixed },
    false_positive_assessment: { type: mongoose.Schema.Types.Mixed },
    feedback: {
      was_false_positive: { type: Boolean, default: null },
      reviewed_by: { type: String, default: null },
      reviewed_at: { type: Date, default: null },
      notes: { type: String, default: null },
    },
    transaction: { type: mongoose.Schema.Types.Mixed },
    report: { type: mongoose.Schema.Types.Mixed },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  }
});

export default mongoose.model("Event", eventSchema);
