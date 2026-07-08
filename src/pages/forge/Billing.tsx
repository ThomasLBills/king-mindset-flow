import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useBilling } from "@/mock/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

const Billing = () => {
  const { data: billing } = useBilling();

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <Link
        to="/app/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Profile
      </Link>
      <header className="mb-6">
        <Eyebrow className="mb-1 block">Membership</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Billing
        </h1>
      </header>

      {!billing ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="rounded-lg border border-line bg-raised p-5">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-2 h-7 w-56" />
            <Skeleton className="mb-5 h-4 w-40" />
            <div className="flex gap-2.5">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-raised p-5">
            <Skeleton className="mb-4 h-3 w-32" />
            <Skeleton className="mb-2 h-5 w-full" />
            <Skeleton className="mb-2 h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SectionCard hatch className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Eyebrow className="mb-1 block">Current plan</Eyebrow>
                <p className="font-display text-2xl font-bold tracking-tight text-bone">
                  {billing.plan}
                </p>
                <p className="mt-1 text-sm text-bone-2">
                  {billing.price} · renews {format(new Date(billing.renewsAtISO), "d MMMM yyyy")}
                </p>
              </div>
              <Badge className="bg-gold text-primary-foreground hover:bg-gold">Active</Badge>
            </div>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  toast.info("Plan changes aren't wired in this demo. Payments come later.")
                }
              >
                Change plan
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
                      Leave the brotherhood?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancelling takes one click, right here. No phone calls and no hoops. Your
                      brothers would rather you stayed, though.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        toast.info("Cancellation isn't wired in this demo. Payments come later.")
                      }
                    >
                      Cancel my plan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SectionCard>

          <SectionCard className="p-5">
            <Eyebrow className="mb-3 block">Payment history</Eyebrow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dim">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-line-soft text-bone-2">
                    <td className="py-2.5">{format(new Date(inv.dateISO), "d MMM yyyy")}</td>
                    <td className="py-2.5 font-display font-semibold text-bone">{inv.amount}</td>
                    <td className="py-2.5 text-right capitalize text-gold">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <p className="text-center text-xs text-dim">
            Honest pricing and a cancel button that works. That's the vow behind the vow.
          </p>
        </div>
      )}
    </div>
  );
};

export default Billing;
