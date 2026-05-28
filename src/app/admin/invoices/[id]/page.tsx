import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import InvoiceEditor from "./InvoiceEditor";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, school:schools(name, address, contact_name, contact_email, district_number)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("*, profile:profiles!user_id(name)")
    .eq("invoice_id", id)
    .order("date");

  return (
    <InvoiceEditor
      invoice={invoice}
      lines={lines || []}
    />
  );
}
