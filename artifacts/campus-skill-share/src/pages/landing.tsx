import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowRight, BookOpen, GraduationCap, Users, Zap } from "lucide-react";
import { useEffect } from "react";

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/feed");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="max-w-3xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground border border-accent/30 font-medium text-sm mb-4">
          <GraduationCap className="w-4 h-4" />
          <span>Exclusive to University Students</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-tight">
          Trade skills.
          <br />
          <span className="text-primary">Build your campus network.</span>
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Need help with Python? Want to learn guitar? Campus Skill Share is the
          noticeboard for human skills. Connect with peers, trade your talents,
          and learn something new.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={login}
            className="group relative inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/25 active:scale-95 cursor-pointer"
            data-testid="button-hero-signin"
          >
            <span className="relative z-10 flex items-center gap-2">
              Sign In to Discover
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 mt-16 border-t border-border/50">
          {[
            {
              icon: Users,
              title: "Verified Peers",
              desc: "Connect safely with other students on campus.",
            },
            {
              icon: Zap,
              title: "Any Skill",
              desc: "From organic chemistry tutoring to graphic design.",
            },
            {
              icon: BookOpen,
              title: "Learn & Earn",
              desc: "Charge a rate or trade skills for free.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center space-y-3 p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
