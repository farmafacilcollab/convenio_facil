/**
 * FarmaFácil Convênios — Seed Script
 * Creates stores, auth users, and profiles.
 *
 * Run with: npx tsx supabase/seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zabfoldmhecxhbehqefa.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STORES = [
  {
    name: "DROGARIA JR LTDA ME",
    cnpj: "07.625.132/0001-58",
    email: "farmafacil.loja01@hotmail.com",
    slug: "loja01",
  },
  {
    name: "DROGARIA AR LTDA",
    cnpj: "52.331.882/0001-71",
    email: "farmafacil.loja02@hotmail.com",
    slug: "loja02",
  },
  {
    name: "DROGARIA JK LTDA ME",
    cnpj: "97.528.758/0001-39",
    email: "farmafacil.loja03@hotmail.com",
    slug: "loja03",
  },
  {
    name: "DROGARIA DR LTDA ME",
    cnpj: "22.019.833/0001-37",
    email: "farmafacil.loja06@hotmail.com",
    slug: "loja04",
  },
  {
    name: "DROGARIA JM LTDA",
    cnpj: "33.610.141/0001-85",
    email: "farmafacil.loja05@hotmail.com",
    slug: "loja05",
  },
];

const STORE_PASSWORD = "FarmaFacil@2026";
const ADMIN_EMAIL = "rh.farmafácil@gmail.com";
const ADMIN_PASSWORD = "FarmaFacilAdmin@2026";

async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Insert stores
  console.log("📦 Creating stores...");
  const { data: storesData, error: storesError } = await supabase
    .from("stores")
    .upsert(STORES, { onConflict: "cnpj" })
    .select();

  if (storesError) {
    console.error("❌ Error creating stores:", storesError.message);
    process.exit(1);
  }
  console.log(`✅ ${storesData.length} stores created/updated\n`);

  // 2. Create store users
  console.log("👤 Creating store users...");
  for (const store of storesData) {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: store.email,
        password: STORE_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log(`   ⚠️  User ${store.email} already exists, skipping...`);
        // Fetch existing user to create profile if needed
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(
          (u) => u.email === store.email
        );
        if (existingUser) {
          await supabase.from("profiles").upsert(
            {
              id: existingUser.id,
              email: store.email,
              role: "store",
              store_id: store.id,
            },
            { onConflict: "id" }
          );
        }
        continue;
      }
      console.error(`❌ Error creating user ${store.email}:`, authError.message);
      continue;
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.user.id,
        email: store.email,
        role: "store",
        store_id: store.id,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error(
        `❌ Error creating profile for ${store.email}:`,
        profileError.message
      );
      continue;
    }

    console.log(`   ✅ ${store.email} → ${store.name} (${store.slug})`);
  }

  // 3. Create admin user
  console.log("\n👑 Creating admin user...");
  const { data: adminAuth, error: adminAuthError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

  if (adminAuthError) {
    if (adminAuthError.message.includes("already been registered")) {
      console.log(`   ⚠️  Admin user already exists, skipping...`);
    } else {
      console.error("❌ Error creating admin user:", adminAuthError.message);
    }
  } else {
    const { error: adminProfileError } = await supabase.from("profiles").upsert(
      {
        id: adminAuth.user.id,
        email: ADMIN_EMAIL,
        role: "admin",
        store_id: null,
      },
      { onConflict: "id" }
    );

    if (adminProfileError) {
      console.error("❌ Error creating admin profile:", adminProfileError.message);
    } else {
      console.log(`   ✅ ${ADMIN_EMAIL} → admin`);
    }
  }

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Login credentials:");
  console.log("   Store users: [store email] / FarmaFacil@2026");
  console.log(`   Admin: ${ADMIN_EMAIL} / FarmaFacilAdmin@2026`);
}

seed().catch(console.error);
