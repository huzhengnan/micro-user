const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const subscriptionPlans = [
    {
        name: 'Basic Plan',
        description: 'Basic Plan - Perfect for casual users',
        price: 999, // $9.99 in cents
        monthlyPoints: 100,
        duration: 30,
        features: [
            '100 points per month',
            'Advanced AI generation',
            'High-definition image quality',
            'Unlimited gallery access',
            'Priority customer support',
            'Custom style templates'
        ]
    },
    {
        name: 'Standard Plan',
        description: 'Standard Plan - Great for regular creators',
        price: 1999, // $19.99 in cents
        monthlyPoints: 250,
        duration: 30,
        features: [
            '250 points per month',
            'Professional AI generation',
            'Ultra-high definition quality',
            'Batch generation features',
            'Advanced editing tools',
            'Priority customer support',
            'Custom model training'
        ]
    },
    {
        name: 'Premium Plan',
        description: 'Premium Plan - For serious creators and professionals',
        price: 2999, // $29.99 in cents
        monthlyPoints: 500,
        duration: 30,
        features: [
            '500 points per month',
            'Professional AI generation',
            'Ultra-high definition quality',
            'Unlimited batch generation',
            'Advanced editing tools',
            'Commercial license',
            'Dedicated customer support',
            'Custom model training',
            'API access'
        ]
    },
    {
        name: 'Basic Plan Yearly',
        description: 'Basic Annual Plan - Save with yearly billing',
        price: 9990, // $99.90 in cents (equivalent to ~$8.33/month)
        monthlyPoints: 100,
        duration: 365,
        features: [
            '100 points per month',
            'Advanced AI generation',
            'High-definition image quality',
            'Unlimited gallery access',
            'Priority customer support',
            'Custom style templates',
            'Annual discount - Save 17%'
        ]
    },
    {
        name: 'Standard Plan Yearly',
        description: 'Standard Annual Plan - Save with yearly billing',
        price: 19990, // $199.90 in cents (equivalent to ~$16.66/month)
        monthlyPoints: 250,
        duration: 365,
        features: [
            '250 points per month',
            'Professional AI generation',
            'Ultra-high definition quality',
            'Batch generation features',
            'Advanced editing tools',
            'Priority customer support',
            'Custom model training',
            'Annual discount - Save 17%'
        ]
    },
    {
        name: 'Premium Plan Yearly',
        description: 'Premium Annual Plan - Save with yearly billing',
        price: 29990, // $299.90 in cents (equivalent to ~$24.99/month)
        monthlyPoints: 500,
        duration: 365,
        features: [
            '500 points per month',
            'Professional AI generation',
            'Ultra-high definition quality',
            'Unlimited batch generation',
            'Advanced editing tools',
            'Commercial license',
            'Dedicated customer support',
            'Custom model training',
            'API access',
            'Annual discount - Save 17%'
        ]
    }
];

async function initSubscriptionPlans() {
    try {
        console.log('🚀 Starting subscription plans initialization...');

        // Check if data already exists
        const existingPlans = await prisma.subscriptionPlan.count();
        if (existingPlans > 0) {
            console.log(`⚠️  Database already contains ${existingPlans} subscription plans`);
            const forceFlag = process.argv.includes('--force');
            if (!forceFlag) {
                console.log('💡 Use --force parameter to reinitialize');
                return;
            }

            // Delete existing data (need to delete payment mappings first due to foreign key constraints)
            console.log('🗑️  Deleting existing payment mappings...');
            await prisma.paymentProductMapping.deleteMany();
            console.log('🗑️  Deleting existing subscription plan data...');
            await prisma.subscriptionPlan.deleteMany();
        }

        // Create subscription plans
        console.log('📝 Creating subscription plans...');
        for (const plan of subscriptionPlans) {
            const created = await prisma.subscriptionPlan.create({
                data: plan
            });
            const priceDisplay = plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`;
            console.log(`✅ Created plan: ${created.name} (${priceDisplay}/${created.duration} days)`);
        }

        console.log('\n🎉 Subscription plans initialization completed!');
        console.log('\n📊 Plans Overview:');

        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: 'asc' }
        });

        plans.forEach(plan => {
            const priceDisplay = plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`;
            const durationText = plan.duration === 365 ? 'year' : `${plan.duration} days`;
            console.log(`  • ${plan.name}: ${priceDisplay}/${durationText} - ${plan.monthlyPoints} points/month`);
        });

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run initialization
initSubscriptionPlans();