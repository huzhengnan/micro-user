const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Payment product mappings based on the provided product IDs
const paymentMappings = [
  // Monthly Plans - Production Environment
  {
    planName: 'Basic Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2Y6cOHhOWLPIp42iBwXGjH',
    environment: 'production'
  },
  {
    planName: 'Standard Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2NYN1msP3QaEepZs36pib1',
    environment: 'production'
  },
  {
    planName: 'Premium Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2xqxgXmFVp4pzTr0pXt6I',
    environment: 'production'
  },
  
  // Yearly Plans - Production Environment
  {
    planName: 'Basic Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ',
    environment: 'production'
  },
  {
    planName: 'Standard Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_5SCdiILdTOhlja24LWPiaj',
    environment: 'production'
  },
  {
    planName: 'Premium Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd',
    environment: 'production'
  },

  // Test Environment Mappings (same product IDs for now)
  {
    planName: 'Basic Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2Y6cOHhOWLPIp42iBwXGjH',
    environment: 'test'
  },
  {
    planName: 'Standard Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2NYN1msP3QaEepZs36pib1',
    environment: 'test'
  },
  {
    planName: 'Premium Plan',
    paymentProvider: 'CREEM',
    productId: 'prod_2xqxgXmFVp4pzTr0pXt6I',
    environment: 'test'
  },
  {
    planName: 'Basic Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ',
    environment: 'test'
  },
  {
    planName: 'Standard Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_5SCdiILdTOhlja24LWPiaj',
    environment: 'test'
  },
  {
    planName: 'Premium Plan Yearly',
    paymentProvider: 'CREEM',
    productId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd',
    environment: 'test'
  }
];

async function initPaymentMappings() {
  try {
    console.log('🚀 Starting payment product mappings initialization...');

    // Get current environment (default to production)
    const environment = process.env.NODE_ENV === 'development' ? 'test' : 'production';
    console.log(`🌍 Environment: ${environment}`);

    // Filter mappings for current environment
    const currentEnvMappings = paymentMappings.filter(mapping => mapping.environment === environment);

    // Check if mappings already exist
    const existingMappings = await prisma.paymentProductMapping.count();
    if (existingMappings > 0) {
      console.log(`⚠️  Database already contains ${existingMappings} payment mappings`);
      const forceFlag = process.argv.includes('--force');
      if (!forceFlag) {
        console.log('💡 Use --force parameter to reinitialize');
        return;
      }
      
      // Delete existing mappings
      console.log('🗑️  Deleting existing payment mappings...');
      await prisma.paymentProductMapping.deleteMany();
    }

    // Get all subscription plans
    const subscriptionPlans = await prisma.subscriptionPlan.findMany();
    console.log(`📋 Found ${subscriptionPlans.length} subscription plans`);

    if (subscriptionPlans.length === 0) {
      console.log('❌ No subscription plans found. Please run init-subscription-plans.js first');
      return;
    }

    // Create payment mappings
    console.log('📝 Creating payment product mappings...');
    let createdCount = 0;

    for (const mapping of currentEnvMappings) {
      // Find matching subscription plan
      const plan = subscriptionPlans.find(p => p.name === mapping.planName);
      
      if (!plan) {
        console.log(`⚠️  Subscription plan not found: ${mapping.planName}`);
        continue;
      }

      try {
        const created = await prisma.paymentProductMapping.create({
          data: {
            subscriptionPlanId: plan.id,
            paymentProvider: mapping.paymentProvider,
            productId: mapping.productId,
            active: true,
            metadata: {
              environment: mapping.environment,
              createdBy: 'init-script'
            }
          }
        });

        console.log(`✅ Created mapping: ${plan.name} -> ${mapping.productId} (${mapping.paymentProvider})`);
        createdCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Mapping already exists: ${plan.name} -> ${mapping.paymentProvider}`);
        } else {
          console.error(`❌ Failed to create mapping for ${plan.name}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Payment mappings initialization completed!`);
    console.log(`📊 Created ${createdCount} mappings for ${environment} environment`);

    // Display summary
    const allMappings = await prisma.paymentProductMapping.findMany({
      include: {
        subscriptionPlan: true
      },
      orderBy: {
        subscriptionPlan: {
          price: 'asc'
        }
      }
    });

    console.log('\n📋 Payment Mappings Summary:');
    allMappings.forEach(mapping => {
      const plan = mapping.subscriptionPlan;
      const priceDisplay = plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`;
      console.log(`  • ${plan.name} (${priceDisplay}) -> ${mapping.productId} [${mapping.paymentProvider}]`);
    });

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initPaymentMappings();