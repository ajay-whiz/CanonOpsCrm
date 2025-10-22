import { createLeadAction } from "../actions";

export default function NewLeadPage() {
  return (
    <form action={createLeadAction} className="p-6 max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">New Lead</h1>
      <input name="contact_id" placeholder="Contact ID (integer)" className="input" required />
      <input name="title" placeholder="Title" className="input" required />
      <textarea name="description" placeholder="Description" className="textarea" />
      <select name="priority" className="select" defaultValue="medium">
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
        <option value="urgent">urgent</option>
      </select>
      <select name="source" className="select" defaultValue="web_form">
        <option value="web_form">web_form</option>
        <option value="email">email</option>
        <option value="phone">phone</option>
        <option value="referral">referral</option>
        <option value="import">import</option>
        <option value="other">other</option>
      </select>
      <button type="submit" className="btn-primary">Create Lead</button>
    </form>
  );
}
