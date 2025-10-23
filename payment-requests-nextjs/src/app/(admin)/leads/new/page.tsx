import { createLeadAction } from "../actions";

export default function NewLeadPage() {
  return (
    <form action={createLeadAction} className="p-6 max-w-6xl space-y-6">
      <h1 className="text-xl font-semibold">New Lead</h1>

      {/* Lead Information */}
      <section>
        <h2 className="text-sm font-medium opacity-70 mb-2">Lead Information</h2>
        <div className="space-y-3">
          {/* Row 1 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Lead Owner</label>
              <input name="lead_owner" className="col-span-8 input" placeholder="Owner name" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Company</label>
              <input name="company" className="col-span-8 input" placeholder="Company (required)" />
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">First Name</label>
              <input name="first_name" className="col-span-8 input" placeholder="First name" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Last Name</label>
              <input name="last_name" className="col-span-8 input" placeholder="Last name (required)" />
            </div>
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Title</label>
              <input name="title" className="col-span-8 input" placeholder="Title (required)" required />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Email</label>
              <input name="email" type="email" className="col-span-8 input" placeholder="Email" />
            </div>
          </div>
          {/* Row 4 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Phone</label>
              <input name="phone" className="col-span-8 input" placeholder="Phone" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Fax</label>
              <input name="fax" className="col-span-8 input" placeholder="Fax" />
            </div>
          </div>
          {/* Row 5 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Mobile</label>
              <input name="mobile" className="col-span-8 input" placeholder="Mobile" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Website</label>
              <input name="website" className="col-span-8 input" placeholder="https://" />
            </div>
          </div>
          {/* Row 6 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Lead Source</label>
              <select name="source" className="col-span-8 select" defaultValue="web_form">
                <option value="web_form">-None- (web_form)</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="referral">Referral</option>
                <option value="import">Import</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Lead Status</label>
              <select name="lead_status" className="col-span-8 select" defaultValue="">
                <option value="">-None-</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="spam">Spam</option>
              </select>
            </div>
          </div>
          {/* Row 7 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Industry</label>
              <select name="industry" className="col-span-8 select" defaultValue="">
                <option value="">-None-</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="it">IT</option>
                <option value="logistics">Logistics</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">No. of Employees</label>
              <input name="employees" type="number" className="col-span-8 input" placeholder="0" />
            </div>
          </div>
          {/* Row 8 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Annual Revenue</label>
              <input name="annual_revenue" className="col-span-8 input" type="number" step="0.01" placeholder="$" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Rating</label>
              <select name="rating" className="col-span-8 select" defaultValue="">
                <option value="">-None-</option>
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
              </select>
            </div>
          </div>
          {/* Row 9 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <span className="col-span-4"></span>
              <div className="col-span-8 flex items-center gap-2">
                <input id="email_opt_out" name="email_opt_out" type="checkbox" className="checkbox" />
                <label htmlFor="email_opt_out" className="text-sm text-gray-600">Email Opt Out</label>
              </div>
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Skype ID</label>
              <input name="skype_id" className="col-span-8 input" placeholder="Skype" />
            </div>
          </div>
          {/* Row 10 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Secondary Email</label>
              <input name="secondary_email" type="email" className="col-span-8 input" placeholder="Secondary email" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Twitter</label>
              <input name="twitter" className="col-span-8 input" placeholder="@" />
            </div>
          </div>
        </div>
      </section>

      {/* Address Information */}
      <section>
        <h2 className="text-sm font-medium opacity-70 mb-2">Address Information</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Street</label>
              <input name="street" className="col-span-8 input" placeholder="Street" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">City</label>
              <input name="city" className="col-span-8 input" placeholder="City" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">State</label>
              <input name="state" className="col-span-8 input" placeholder="State" />
            </div>
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Zip Code</label>
              <input name="zip" className="col-span-8 input" placeholder="Zip Code" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-6 grid grid-cols-12 items-center gap-2">
              <label className="col-span-4 text-right text-sm text-gray-600">Country</label>
              <input name="country" className="col-span-8 input" placeholder="Country" />
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-sm font-medium opacity-70 mb-2">Description Information</h2>
        <textarea name="description" className="textarea" placeholder="Description" />
      </section>

      {/* Existing fields still required by server action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Contact ID (integer)</label>
          <input name="contact_id" className="input" required />
        </div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" className="select" defaultValue="medium">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" className="btn-primary">Create Lead</button>
      </div>
    </form>
  );
}
