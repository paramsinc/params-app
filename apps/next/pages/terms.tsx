import { MarkdownRenderer } from 'app/features/repository/detail-public/MarkdownRenderer'

export default function Terms() {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
      <MarkdownRenderer linkPrefix="/terms">
        {`# Terms and Conditions for Params, Inc.

Last Updated: December 4, 2024

## 1. Acceptance of Terms

By accessing or using Params, Inc.'s website ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these terms, you may not access the Service.

## 2. Description of Service

Params, Inc. provides a platform where users can:
- Create and maintain professional profiles
- Upload and share coding templates
- Offer their services for booking
- Receive payment for their services

## 3. User Accounts

### 3.1 Registration
- You must register for an account to access certain features of the Service
- You must provide accurate, current, and complete information
- You are responsible for maintaining the confidentiality of your account credentials
- You are responsible for all activities under your account

### 3.2 Account Termination
We reserve the right to suspend or terminate accounts that:
- Violate these Terms
- Engage in fraudulent activity
- Provide false information
- Remain inactive for an extended period

## 4. Content Guidelines

### 4.1 User Content
By uploading content, you:
- Retain your intellectual property rights
- Grant Params, Inc. a non-exclusive license to use, display, and distribute your content
- Warrant that you have the right to share such content
- Agree not to upload malicious code or harmful content

### 4.2 Coding Templates
- Must be original work or properly licensed
- Must not infringe on others' intellectual property rights
- Must be free of malware and malicious code
- Must include appropriate documentation and usage instructions

## 5. Booking and Payment Terms

### 5.1 Service Providers
- May set their own rates and availability
- Must honor confirmed bookings
- Must maintain professional standards
- Are responsible for their own taxes and compliance

### 5.2 Payment Processing
- All payments are processed through secure third-party providers
- Params, Inc. takes a service fee (percentage to be specified in separate fee schedule)
- Refunds are subject to our Refund Policy
- Currency conversions are subject to current exchange rates

## 6. Prohibited Activities

Users may not:
- Impersonate others
- Share false or misleading information
- Engage in harassment or abuse
- Attempt to circumvent platform fees
- Violate applicable laws or regulations
- Scrape or harvest data from the Service
- Interfere with the Service's operation

## 7. Privacy and Data Protection

### 7.1 Data Collection
We collect and process personal data as described in our Privacy Policy, including:
- Account information
- Profile content
- Usage data
- Payment information

### 7.2 Data Security
We implement reasonable security measures to protect user data but cannot guarantee absolute security.

## 8. Intellectual Property

### 8.1 Platform Content
- The Service, including its original content and features, is owned by Params, Inc.
- Our trademarks, logo, and brand elements may not be used without permission

### 8.2 User Content
- Users retain rights to their content
- Users grant Params, Inc. license to use content for Service operation
- Users are responsible for ensuring they have rights to shared content

## 9. Limitation of Liability

### 9.1 Service Availability
- The Service is provided "as is" without warranties
- We do not guarantee uninterrupted or error-free service
- We are not liable for lost profits or data

### 9.2 User Interactions
- We are not responsible for user-to-user transactions
- Users are responsible for their own interactions
- We do not guarantee the quality of services provided

## 10. Disputes

### 10.1 Resolution Process
- Users agree to attempt informal resolution first
- Disputes will be resolved through arbitration
- Class action waiver applies

### 10.2 Governing Law
These Terms are governed by [Jurisdiction] law.

## 11. Changes to Terms

We reserve the right to modify these Terms at any time. Users will be notified of significant changes.

## 12. Contact Information

For questions about these Terms, contact:
Params, Inc.
hey@params.com

## 13. Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in effect.
`}
      </MarkdownRenderer>
    </div>
  )
}
