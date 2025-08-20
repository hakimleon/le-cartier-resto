import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { RecipeCostForm } from "./RecipeCostForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from 'next/navigation';

export default function RecipeCostPage() {
  // This page is a fallback. If no dishId is provided,
  // we can redirect to the menu or show a message.
  redirect('/menu');
}
