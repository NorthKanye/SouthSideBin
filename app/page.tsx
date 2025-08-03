"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Recycle, Leaf, CheckCircle, Phone, Mail, Star, Shield, Clock, Sparkles } from "lucide-react"

interface ServiceDate {
  id: number
  date: Date
  formatted: string
  dayMonth: string
}

interface BinOption {
  id: number
  name: string
  description: string
  price: number
  popular?: boolean
  bins: { color: string; type: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[]
}

interface FormData {
  name: string
  email: string
  phone: string
  address: string
  notes: string
  waterAccess: boolean
  powerAccess: boolean
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  waterAccess?: string
  powerAccess?: string
}

const binOptions: BinOption[] = [
  {
    id: 1,
    name: "Single Bin",
    description: "Perfect for small households or apartments",
    price: 20,
    bins: [{ color: "bg-red-500", type: "General Waste", icon: Trash2 }],
  },
  {
    id: 2,
    name: "Double Bin",
    description: "Ideal for most families - our most popular choice",
    price: 40,
    popular: true,
    bins: [
      { color: "bg-red-500", type: "General Waste", icon: Trash2 },
      { color: "bg-yellow-500", type: "Recycling", icon: Recycle },
    ],
  },
  {
    id: 3,
    name: "Triple Bin",
    description: "Complete waste solution for large households",
    price: 50,
    bins: [
      { color: "bg-red-500", type: "General Waste", icon: Trash2 },
      { color: "bg-yellow-500", type: "Recycling", icon: Recycle },
      { color: "bg-green-500", type: "Garden Waste", icon: Leaf },
    ],
  },
]

const discountCodes: Record<string, number> = {
  FIRST10: 10,
  CLEAN20: 20,
  FAMILY15: 15,
}

const features = [
  { icon: Sparkles, title: "Eco-Friendly Products", description: "Safe for your family and the environment" },
  { icon: Shield, title: "Fully Insured", description: "Complete peace of mind with every service" },
  { icon: Clock, title: "Regular Service", description: "Weekly, fortnightly, or monthly options" },
  { icon: Star, title: "5-Star Rated", description: "Trusted by hundreds of satisfied customers" },
]

export default function BinCleaningService() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    waterAccess: false,
    powerAccess: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const validatePhone = useCallback((phone: string): boolean => {
    // Australian phone numbers: optional +61, or a 0, followed by 9 digits.
    // This supports formats like 0412345678, +61412345678, 0212345678 etc.
    const phoneRegex = /^(?:\+61|0)\d{9}$/
    return phoneRegex.test(phone.replace(/[\s-()]/g, ""))
  }, [])

  const getNextMondays = useMemo((): ServiceDate[] => {
    const mondays: ServiceDate[] = []
    const today = new Date()

    // Find the next Monday
    const nextMonday = new Date(today)
    const daysUntilMonday = (1 + 7 - today.getDay()) % 7
    if (daysUntilMonday === 0 && today.getDay() === 1) {
      // If today is Monday, start from next Monday
      nextMonday.setDate(today.getDate() + 7)
    } else {
      nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday))
    }

    // Generate 3 consecutive Mondays
    for (let i = 0; i < 3; i++) {
      const monday = new Date(nextMonday)
      monday.setDate(nextMonday.getDate() + i * 7)

      mondays.push({
        id: i + 1,
        date: monday,
        formatted: monday.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        dayMonth: monday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })
    }

    return mondays
  }, [])

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    if (!formData.address.trim()) {
      errors.address = "Service address is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, validateEmail, validatePhone])

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [formErrors],
  )

  const applyDiscountCode = useCallback(() => {
    const discount = discountCodes[discountCode.toUpperCase()]
    if (discount) {
      setAppliedDiscount(discount)
    } else {
      setAppliedDiscount(0)
    }
  }, [discountCode])

  const finalPrice = useMemo(() => {
    if (!selectedOption) return 0
    const basePrice = binOptions.find((option) => option.id === selectedOption)?.price || 0
    return Math.max(0, basePrice - appliedDiscount)
  }, [selectedOption, appliedDiscount])

  const selectedBinOption = useMemo(() => binOptions.find((option) => option.id === selectedOption), [selectedOption])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOption) {
      alert("Please select a bin cleaning package")
      return
    }

    if (!selectedDate) {
      alert("Please select a service date")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const selectedServiceDate = getNextMondays.find((d) => d.id === selectedDate)

      // Prepare data for Stripe checkout
      const bookingData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        waterAccess: formData.waterAccess,
        powerAccess: formData.powerAccess,
        bins: selectedOption.toString(),
        date: selectedServiceDate?.date.toISOString(),
        dateFormatted: selectedServiceDate?.formatted,
        discountCode: discountCode,
        appliedDiscount: appliedDiscount,
        finalPrice: finalPrice
      }

      // Create Stripe checkout session
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error:", error)
      alert("There was an error processing your booking. Please try again or call us directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg">
                 <Image src="/logo.jpg" alt="SouthSide Bin Cleaning" width={100} height={100} />
                 
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Southside Bin Cleaning</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Professional Bin Cleaning Service</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
                <a
                  href="mailto:info@southsidebincleaning.com"
                  className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                  aria-label="Email SouthSide Bin Cleaning"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">info@southsidebincleaning.com</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          
          {/* Choose Your Package Section - Now bigger and on top */}
          <section className="py-12">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Choose Your Package</h3>
                <p className="text-gray-600">Select the perfect cleaning package for your household needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {binOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg relative ${
                      selectedOption === option.id
                        ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
                        : "hover:shadow-md bg-white"
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedOption === option.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedOption(option.id)
                      }
                    }}
                  >
                    {option.popular && (
                      <Badge className="absolute -top-2 left-4 bg-orange-500 hover:bg-orange-600">Most Popular</Badge>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            {option.name}
                            {selectedOption === option.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm sm:text-base">{option.description}</CardDescription>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600">${option.price}</div>
                          <div className="text-xs text-gray-500">per service</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {option.bins.map((bin, index) => (
                          <div key={index} className="flex flex-col items-center space-y-2 min-w-0">
                            <div
                              className={`w-10 h-12 sm:w-12 sm:h-16 ${bin.color} rounded-lg flex items-center justify-center shadow-md`}
                              aria-label={`${bin.type} bin`}
                            >
                              <bin.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <span className="text-xs text-gray-600 text-center leading-tight">{bin.type}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Book Your Service Section (now contains only date selection and contact form) */}
          <section className="max-w-3xl mx-auto pb-16">
            <div className="mb-8 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Book Your Service</h3>
              <p className="text-gray-600">Select a date and provide your details to book your bin cleaning service</p>
            </div>

            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Service Date Selection */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Service Date</h4>
                    <p className="text-gray-600 mb-4">
                      Select your preferred Monday for bin cleaning service (8am-2pm)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {getNextMondays.map((serviceDate, index) => (
                        <Card
                          key={serviceDate.id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg relative ${
                            selectedDate === serviceDate.id
                              ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
                              : "hover:shadow-md bg-white"
                          }`}
                          onClick={() => setSelectedDate(serviceDate.id)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedDate === serviceDate.id}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setSelectedDate(serviceDate.id)
                            }
                          }}
                        >
                          {index === 0 && (
                            <Badge className="absolute -top-2 left-4 bg-green-500 hover:bg-green-600">
                              Next Available
                            </Badge>
                          )}

                          <CardContent className="pt-6 pb-6 text-center">
                            <div className="mb-4">
                              <div className="text-2xl font-bold text-gray-900 mb-1">{serviceDate.dayMonth}</div>
                              <div className="text-sm text-gray-600 mb-2">
                                {serviceDate.date.toLocaleDateString("en-US", { weekday: "long" })}
                              </div>
                              <div className="text-xs text-gray-500">{serviceDate.date.getFullYear()}</div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-center space-x-2 text-blue-600">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">8am-2pm</span>
                              </div>

                              {selectedDate === serviceDate.id && (
                                <div className="flex items-center justify-center space-x-1 text-green-600 text-sm">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Selected</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Need a different date?{" "}
                        <a href="mailto:info@southsidebincleaning.com" className="text-blue-600 hover:underline">
                          Email Us
                        </a>{" "}
                        to discuss custom scheduling options.
                      </p>
                    </div>
                  </div>

                  {/* Price Summary */}
                  {selectedOption && selectedBinOption && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Price Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{selectedBinOption.name}:</span>
                          <span>${selectedBinOption.price}</span>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount Applied:</span>
                            <span>-${appliedDiscount}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-bold text-base">
                          <span>Total:</span>
                          <span className="text-blue-600">${finalPrice}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your full name"
                        className={formErrors.name ? "border-red-500 focus:border-red-500" : ""}
                        aria-describedby={formErrors.name ? "name-error" : undefined}
                      />
                      {formErrors.name && (
                        <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="0412 345 678"
                        className={formErrors.phone ? "border-red-500 focus:border-red-500" : ""}
                        aria-describedby={formErrors.phone ? "phone-error" : undefined}
                      />
                      {formErrors.phone && (
                        <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                      className={formErrors.email ? "border-red-500 focus:border-red-500" : ""}
                      aria-describedby={formErrors.email ? "email-error" : undefined}
                    />
                    {formErrors.email && (
                      <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">
                      Service Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Enter your full address including suburb and postcode"
                      rows={3}
                      className={formErrors.address ? "border-red-500 focus:border-red-500" : ""}
                      aria-describedby={formErrors.address ? "address-error" : undefined}
                    />
                    {formErrors.address && (
                      <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                

              

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Any special instructions, gate codes, or requests..."
                      rows={3}
                    />
                  </div>

                  {/* Discount Code Section */}
                  <div className="border-t pt-6">
                    <Label htmlFor="discount" className="text-sm font-medium">
                      Discount Code
                    </Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        id="discount"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Enter discount code"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={applyDiscountCode}
                        disabled={!discountCode.trim()}
                        className="whitespace-nowrap bg-transparent"
                      >
                        Apply Code
                      </Button>
                    </div>
                    {appliedDiscount > 0 && (
                      <p className="text-green-600 text-sm mt-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Discount applied: ${appliedDiscount} off!
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Try: <code className="bg-gray-100 px-1 rounded">FIRST5</code>,{" "}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg transition-colors"
                    disabled={!selectedOption || !selectedDate || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        Book Service Now
                        {selectedOption && <span className="ml-2">- ${finalPrice}</span>}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to our terms of service. We&apos;ll contact you within 24 hours to
                    confirm your booking.
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-blue-600 p-1 rounded">
                  <Trash2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Southside Bin Cleaning</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Professional bin cleaning service • Eco-friendly • Sanitise-Deoderised
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                <span>© 2025 Southside Bin Cleaning. All rights reserved.</span>
                <a href="mailto:info@cleanbinspro.com" className="hover:text-blue-600 transition-colors">
                  info@southsidebincleaning.com
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
