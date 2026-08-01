// Built-in contracts inlined as strings so /api/contracts/seed can populate
// a fresh D1 database without depending on the static asset bundle.

export const SEED_CONTRACTS = [
  {
    id: "C-001",
    title: "BrightDesk SaaS Subscription Agreement",
    content: `Contract ID: C-001
Title: BrightDesk SaaS Subscription Agreement
Parties: Northstar Solutions Ltd. and BrightDesk Software Ltd.

2.1 Payment
The Customer must pay each undisputed invoice within 15 calendar days after the invoice date.

5.2 Termination
Either party may terminate this Agreement for convenience by giving the other party 30 days written notice.

7.1 Automatic Renewal
The Agreement automatically renews for another 12-month term unless the Customer gives written notice at least 60 days before the current term ends.

9.3 Limitation of Liability
BrightDesk's total liability under this Agreement will not exceed the fees paid by the Customer during the one month before the event that caused the claim.

Dataset Note:
This excerpt does not include a data protection clause.`,
  },
  {
    id: "C-002",
    title: "NovaStaff Professional Services Agreement",
    content: `Contract ID: C-002
Title: NovaStaff Professional Services Agreement
Parties: Northstar Solutions Ltd. and NovaStaff Services Ltd.

3.1 Payment
The Customer must pay 100% of the project fee before NovaStaff begins any work.

6.1 Termination
NovaStaff may terminate the Agreement for any reason by giving 7 days notice. The Customer may terminate only for a material breach that remains unfixed for 30 days.

8.1 Confidentiality
The Customer must protect all confidential information received from NovaStaff. NovaStaff has no confidentiality duty for information received from the Customer.

10.1 Intellectual Property
NovaStaff owns all reports, software, designs, and other work created under this Agreement. The Customer receives a non-transferable licence to use the work for six months.

Dataset Note:
This excerpt does not include an automatic renewal clause.`,
  },
  {
    id: "C-003",
    title: "CloudMinds Data Processing Addendum",
    content: `Contract ID: C-003
Title: CloudMinds Data Processing Addendum
Parties: Northstar Solutions Ltd. and CloudMinds Hosting Ltd.

2.2 Use of Data
CloudMinds may use personal data for providing the service and for any other internal business purpose.

4.1 Security
CloudMinds will encrypt personal data while it is being sent over public networks. Encryption of stored data is not required.

5.2 Breach Notice
CloudMinds will notify the Customer of a confirmed personal data breach within 72 hours after confirmation.

6.1 Subprocessors
CloudMinds may appoint new subprocessors without prior approval. An updated list will be published on its website.

8.1 Data Return and Deletion
CloudMinds will delete or return personal data within 90 days after the service ends.

Dataset Note:
All clauses in this excerpt relate to data protection.`,
  },
  {
    id: "C-004",
    title: "EventPro Partnership Agreement",
    content: `Contract ID: C-004
Title: EventPro Partnership Agreement
Parties: Northstar Solutions Ltd. and EventPro Bangladesh Ltd.

3.2 Payment
Undisputed invoices are payable within 30 calendar days after receipt and acceptance of the related service.

7.1 Termination
Either party may terminate this Agreement for convenience by giving 30 days written notice.

9.1 Confidentiality
Both parties must protect the other party's confidential information and use it only for this Agreement. This duty continues for three years after the Agreement ends. Public, previously known, and independently developed information is excluded.

Dataset Note:
This agreement has no automatic renewal clause.`,
  },
  {
    id: "C-005",
    title: "MarketLoop Marketing Services Agreement",
    content: `Contract ID: C-005
Title: MarketLoop Marketing Services Agreement
Parties: Northstar Solutions Ltd. and MarketLoop Agency Ltd.

2.1 Payment
All invoices must be paid within 7 calendar days and before the related campaign begins.

4.3 Automatic Renewal
After the first month, the Agreement renews one month at a time. Either party may stop the next renewal by giving 7 days written notice.

6.2 Termination
Either party may terminate the Agreement for convenience by giving 14 days written notice.

8.1 Intellectual Property
MarketLoop owns all campaign designs, reports, and custom materials. The Customer may use them only while this Agreement remains active.

10.1 Liability
The Customer has unlimited liability. MarketLoop's total liability is limited to one month of fees.

Dataset Note:
The agreement contains several clauses that differ from the company standards.`,
  },
  {
    id: "C-006",
    title: "SecureLink Vendor Agreement",
    content: `Contract ID: C-006
Title: SecureLink Vendor Agreement
Parties: Northstar Solutions Ltd. and SecureLink Systems Ltd.

3.1 Payment
The Customer will pay undisputed invoices within 30 calendar days after accepting the delivered work.

7.2 Termination for Breach
Either party may terminate the Agreement immediately after any breach. The party in breach does not have a right to fix the breach.

9.1 Data Protection
Personal data must be encrypted while being sent and while being stored. Confirmed breaches must be reported within 24 hours. New subprocessors require the Customer's written approval. Data must be deleted or returned within 30 days after termination.

11.1 Limitation of Liability
For ordinary claims, each party's total liability is limited to the fees paid during the previous 12 months. The limit does not apply to fraud, gross negligence, confidentiality breaches, data protection breaches, or intellectual property infringement.

Dataset Note:
Most clauses follow the company standards, but the termination clause needs review.`,
  },
  {
    id: "C-007",
    title: "Freelance Development Agreement",
    content: `Contract ID: C-007
Title: Freelance Development Agreement
Parties: Northstar Solutions Ltd. and an Independent Developer

2.1 Payment
The Customer will pay 50% of the total fee before work begins and 50% after final acceptance.

5.1 Confidentiality
Both parties must protect confidential information for one year after the Agreement ends.

7.1 Intellectual Property
After full payment, the Customer owns all custom deliverables. The Developer keeps ownership of tools created before this Agreement and gives the Customer a permanent licence to use those tools within the deliverables.

9.1 Limitation of Liability
The Developer's total liability is limited to the fees paid during the previous 12 months.

Dataset Note:
This excerpt does not include a termination clause.`,
  },
  {
    id: "C-008",
    title: "Regional Distribution Agreement",
    content: `Contract ID: C-008
Title: Regional Distribution Agreement
Parties: Northstar Solutions Ltd. and Horizon Distribution Ltd.

3.1 Payment
The Customer must pay undisputed invoices within 30 calendar days after receipt.

6.1 Termination
Either party may terminate for convenience by giving 90 days written notice.

8.1 Automatic Renewal
The Agreement automatically renews for a further 24 months unless either party gives 90 days written notice before the current term ends.

10.1 Confidentiality
Both parties must protect the other party's confidential information for three years after the Agreement ends.

Dataset Note:
This excerpt does not include a limitation of liability clause.`,
  },
];