import "dotenv/config";
import { provisionAllTestUsers } from "../tests/helpers/seed-users";

async function main() {
  console.log("Seeding test users into database...");
  const users = await provisionAllTestUsers();
  console.log(`Successfully provisioned ${Object.keys(users).length} test users:`);
  for (const email of Object.keys(users)) {
    console.log(` - ${email} (role: ${users[email].credentials.role}, mfaEnabled: ${users[email].credentials.mfaEnabled})`);
  }
}

main().catch(err => {
  console.error("Failed to seed test users:", err);
  process.exit(1);
});
