import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "test@example.com" },
                password: { label: "Password", type: "password" }, // We'll ignore password for now
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                // For this MVP, we log in if the user exists, ignoring password
                if (user) {
                    return user; // Return user object
                }
                return null; // Login failed
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string;
                // Add role to session
                const user = await prisma.user.findUnique({ where: { id: token.sub as string } });
                (session.user as any).role = user?.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                (token as any).role = (user as any).role;
            }
            return token;
        }
    },
    pages: {
        signIn: '/login',
    }
});
