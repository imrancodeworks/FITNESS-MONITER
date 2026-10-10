import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    if (!email || !password) {
      redirect("/login?error=MissingCredentials");
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        redirect("/login?error=InvalidCredentials");
      }

      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        redirect("/login?error=InvalidCredentials");
      }

      // Create secure session
      await createSession(user.id, user.role);

    } catch (e) {
      if (e instanceof Error && e.message === "NEXT_REDIRECT") {
        throw e;
      }
      redirect("/login?error=InternalError");
    }
    
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-brand-500 rounded-xl flex items-center justify-center text-white mb-4">
            <Dumbbell size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fitness Monitoring</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>
        
        {/* We can display error if searchParams has error, but Next.js 15 requires awaiting searchParams, so this is a client-side warning normally or just read await searchParams for server component. Since we can't await searchParams directly in the render of a non-async component, I will change this to an async component. */}
        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password" 
              name="password"
              required
              className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-brand-500 text-white rounded-md h-10 text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
