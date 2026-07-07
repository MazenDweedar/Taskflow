import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity.js';
import { Project } from './projects/entities/project.entity.js';
import { Task, TaskStatus, TaskPriority } from './tasks/entities/task.entity.js';

const DEMO_EMAIL = 'demo@taskflow.dev';
const DEMO_PASSWORD = 'demo1234';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'changeme',
    database: process.env.DB_NAME ?? 'taskflow',
    entities: [User, Project, Task],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('📦 Connected to database');

  // Run migrations first
  await dataSource.runMigrations();
  console.log('✅ Migrations applied');

  const userRepo = dataSource.getRepository(User);
  const projectRepo = dataSource.getRepository(Project);
  const taskRepo = dataSource.getRepository(Task);

  // Check if demo user already exists
  let user = await userRepo.findOne({ where: { email: DEMO_EMAIL } });
  if (user) {
    console.log(`⚠️  Demo user already exists (${DEMO_EMAIL}), skipping seed.`);
    await dataSource.destroy();
    return;
  }

  // Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  user = userRepo.create({ email: DEMO_EMAIL, passwordHash });
  user = await userRepo.save(user);
  console.log(`👤 Created demo user: ${DEMO_EMAIL}`);

  // Create projects
  const project1 = await projectRepo.save(
    projectRepo.create({
      name: 'Website Redesign',
      description: 'Redesign the company marketing website with a modern look and feel.',
      ownerId: user.id,
    }),
  );

  const project2 = await projectRepo.save(
    projectRepo.create({
      name: 'Mobile App MVP',
      description: 'Build the first version of our mobile application for iOS and Android.',
      ownerId: user.id,
    }),
  );

  const project3 = await projectRepo.save(
    projectRepo.create({
      name: 'API Integration',
      description: 'Integrate third-party payment and notification APIs.',
      ownerId: user.id,
    }),
  );
  console.log('📁 Created 3 demo projects');

  // Create tasks across projects with varied statuses and priorities
  const tasks = [
    // Website Redesign tasks
    {
      projectId: project1.id,
      title: 'Design new homepage mockup',
      description: 'Create high-fidelity mockups for the new homepage layout.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: '2025-07-15',
    },
    {
      projectId: project1.id,
      title: 'Implement responsive navigation',
      description: 'Build the responsive nav bar with mobile hamburger menu.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: '2025-07-20',
    },
    {
      projectId: project1.id,
      title: 'Set up analytics tracking',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
    },
    {
      projectId: project1.id,
      title: 'Write SEO meta descriptions',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '2025-08-01',
    },

    // Mobile App MVP tasks
    {
      projectId: project2.id,
      title: 'Set up React Native project',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
    },
    {
      projectId: project2.id,
      title: 'Implement login screen',
      description: 'Build login screen with email/password and social auth buttons.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: '2025-07-25',
    },
    {
      projectId: project2.id,
      title: 'Design app icon and splash screen',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    },

    // API Integration tasks
    {
      projectId: project3.id,
      title: 'Research payment gateway options',
      description: 'Compare Stripe, PayPal, and Square for our use case.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
    },
    {
      projectId: project3.id,
      title: 'Implement Stripe checkout flow',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: '2025-07-30',
    },
    {
      projectId: project3.id,
      title: 'Add email notification service',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '2025-08-15',
    },
    {
      projectId: project3.id,
      title: 'Write API integration tests',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
    },
  ];

  for (const taskData of tasks) {
    await taskRepo.save(taskRepo.create(taskData));
  }
  console.log(`✅ Created ${tasks.length} demo tasks`);

  console.log('\n────────────────────────────────────');
  console.log('🎉 Seed complete!');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('────────────────────────────────────\n');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
