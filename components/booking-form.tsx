"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,

  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useToast } from "@/components/ui/use-toast";

const AustellianPhone = /^(?:\+61|0)[2-9]\d{8}$/

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().regex(AustellianPhone, 'Invalid Number!'),
  address: z.string().min(5, { message: "Please enter a valid address." }),
  discountCode: z.string().optional(),
  bins: z.enum(["1", "2", "3"]),
  date: z.date(),
});

export function BookingForm() {
  const { toast } = useToast();
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    isValid: boolean;
    discountAmount: number;
    discountPercent: number;
    finalPrice: number;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      discountCode: "",
    },
  });

  const validateDiscountCode = async (code: string, bins: string) => {
    if (!code.trim()) {
      setDiscountInfo(null);
      return;
    }

    setIsValidatingDiscount(true);
    try {
      const response = await fetch("/api/validate-discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discountCode: code, bins }),
      });

      const data = await response.json();
      
      if (response.ok && data.isValid) {
        setDiscountInfo({
          isValid: true,
          discountAmount: data.discountAmount || 0,
          discountPercent: data.discountPercent || 0,
          finalPrice: data.finalPrice,
        });
        toast({
          title: "Discount Applied!",
          description: `${data.discountPercent > 0 
            ? `${data.discountPercent}% discount` 
            : `$${data.discountAmount} discount`} has been applied.`,
        });
      } else {
        setDiscountInfo(null);
        toast({
          title: "Invalid Discount Code",
          description: data.error || "The discount code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating discount:", error);
      setDiscountInfo(null);
      toast({
        title: "Error",
        description: "Unable to validate discount code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Prepare submission data with discount information
      const submissionData = {
        ...values,
        discountCode: values.discountCode || "",
        appliedDiscount: discountInfo?.discountAmount || discountInfo?.discountPercent || 0,
        finalPrice: discountInfo?.finalPrice || undefined,
      };

      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="0412 345 678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discountCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Code (Optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder="Enter discount code" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (discountInfo) {
                        setDiscountInfo(null);
                      }
                    }}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const bins = form.getValues("bins");
                    if (field.value && bins) {
                      validateDiscountCode(field.value, bins);
                    }
                  }}
                  disabled={!field.value || !form.getValues("bins") || isValidatingDiscount}
                >
                  {isValidatingDiscount ? "Validating..." : "Apply"}
                </Button>
              </div>
              <FormMessage />
              {discountInfo?.isValid && (
                <p className="text-sm text-green-600">
                  ✓ Discount applied: {discountInfo.discountPercent > 0 
                    ? `${discountInfo.discountPercent}% off` 
                    : `$${discountInfo.discountAmount} off`}
                </p>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bins"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Bins</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of bins" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 Bin - $20</SelectItem>
                  <SelectItem value="2">2 Bins - $40</SelectItem>
                  <SelectItem value="3">3 Bins - $50</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Service Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate()))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Book Now & Proceed to Payment</Button>
      </form>
    </Form>
  );
}
