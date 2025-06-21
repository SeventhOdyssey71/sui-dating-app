# Deployment Checklist

## Pre-Deployment

### 1. Smart Contract Deployment (Mainnet)
- [ ] Deploy messaging contract to mainnet
- [ ] Deploy NFT contract to mainnet
- [ ] Deploy games contract to mainnet
- [ ] Update all contract addresses in `.env.production`
- [ ] Verify contract deployment and functionality
- [ ] Fund game contracts with initial SUI

### 2. Environment Configuration
- [ ] Create `.env.local` from `.env.production`
- [ ] Update `NEXT_PUBLIC_SUI_NETWORK` to `mainnet`
- [ ] Add production contract addresses
- [ ] Configure analytics (GA, Sentry)
- [ ] Set up monitoring alerts

### 3. Security Audit
- [ ] Review smart contract security
- [ ] Check for exposed private keys
- [ ] Validate CORS settings
- [ ] Test CSP headers
- [ ] Review API rate limiting
- [ ] Audit dependencies for vulnerabilities

### 4. Performance Testing
- [ ] Run Lighthouse audit
- [ ] Test with slow network conditions
- [ ] Verify caching is working
- [ ] Check bundle sizes
- [ ] Test with high user load

### 5. Functionality Testing
- [ ] Test wallet connection (all providers)
- [ ] Test messaging functionality
- [ ] Test NFT minting and transfers
- [ ] Test both games thoroughly
- [ ] Test group chat creation and messaging
- [ ] Verify all API endpoints

## Deployment

### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### 2. Environment Variables
- [ ] Set all production env vars in Vercel dashboard
- [ ] Verify environment variables are loaded
- [ ] Test deployment with production settings

### 3. Domain Configuration
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure DNS records
- [ ] Test domain accessibility

### 4. Monitoring Setup
- [ ] Set up Vercel Analytics
- [ ] Configure Google Analytics
- [ ] Set up Sentry error tracking
- [ ] Create uptime monitoring
- [ ] Set up performance alerts

## Post-Deployment

### 1. Verification
- [ ] Test all features on production
- [ ] Verify smart contract interactions
- [ ] Check analytics are tracking
- [ ] Test error reporting
- [ ] Monitor initial user interactions

### 2. Performance Monitoring
- [ ] Monitor API response times
- [ ] Check cache hit rates
- [ ] Monitor gas costs
- [ ] Track user engagement metrics
- [ ] Review error logs

### 3. Maintenance Plan
- [ ] Set up automated backups
- [ ] Plan for contract upgrades
- [ ] Document admin procedures
- [ ] Create incident response plan
- [ ] Schedule security reviews

## Rollback Plan

In case of issues:
1. Revert to previous deployment in Vercel
2. Update environment variables if needed
3. Communicate with users about downtime
4. Fix issues in staging environment
5. Re-deploy when resolved

## Important Commands

```bash
# Build production bundle
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## Support Contacts

- Vercel Support: https://vercel.com/support
- Sui Discord: https://discord.gg/sui
- Team Emergency Contact: [Add contact info]