# Security Policy

## Supported Versions

The following versions of Azure Maps Address AutoComplete PCF Control are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the Azure Maps Address AutoComplete PCF Control seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. **Email**: Send details to [your-email@example.com] (replace with your actual email)
3. **GitHub Private Reporting**: Use GitHub's private vulnerability reporting feature (if enabled)

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, injection, data exposure)
- Location of the affected code (file path and line numbers if known)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Potential impact of the vulnerability
- Any suggested fixes (optional)

### What to Expect

| Timeframe | Action |
|-----------|--------|
| **24-48 hours** | Initial acknowledgment of your report |
| **1-2 weeks** | Assessment and validation of the vulnerability |
| **2-4 weeks** | Development and testing of a fix |
| **Upon fix release** | Public disclosure and credit (if desired) |

### Disclosure Policy

- We will work with you to understand and resolve the issue quickly
- We will keep you informed of our progress
- We will credit you in the release notes (unless you prefer to remain anonymous)
- We ask that you give us reasonable time to address the issue before public disclosure

## Security Best Practices for Users

When using this PCF control, please follow these security guidelines:

### Azure Maps Subscription Key

- **Never** expose your Azure Maps subscription key in client-side code
- Store the key securely in Dataverse environment variables
- Use Azure Key Vault for production environments
- Rotate keys periodically

### Power Platform Security

- Apply appropriate security roles to limit access to address data
- Enable audit logging for sensitive operations
- Review field-level security for address fields

### Data Privacy

- Be aware of data residency requirements for address data
- Comply with GDPR and other data protection regulations
- Implement data retention policies as needed

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2). We recommend:

- Enabling GitHub watch notifications for releases
- Subscribing to security advisories
- Regularly updating to the latest supported version

## Contact

For security-related inquiries that are not vulnerabilities, please open a [GitHub Discussion](https://github.com/aidevme/azure-maps-address-autocomplete/discussions) or contact the maintainers.

---

Thank you for helping keep the Azure Maps Address AutoComplete PCF Control secure!
