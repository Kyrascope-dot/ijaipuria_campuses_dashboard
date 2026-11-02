import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/** One-time seed route to create the initial admin.
 *  Disabled once an admin already exists. */
export async function POST(request: Request) {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json({ error: "Admin already exists. Seed is disabled." }, { status: 403 });
    }

    let body: any = {};
    try { body = await request.json(); } catch {}
    const email = body.email || "jimn@gmail.com";
    const password = body.password || "jimn@123";
    const name = body.name || "JIMN Principal";

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase().trim(), password: hashed, name, role: "admin" });

    return NextResponse.json({
      message: "Admin created successfully",
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message ?? "Internal server error" }, { status: 500 });
  }
}
