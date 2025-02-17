"use client"

import { useState } from "react"
import { CalendarIcon, HelpCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { countries } from "./data/countries"
import type { Country } from "./types"

// Currency options
const currencies = {
  GBP: "British Pound (£)",
  EUR: "Euro (€)",
  USD: "US Dollar ($)",
}

// Updated emission templates with diverse sectors
const emissionTemplates = {
  // Energy Sector (GBP based)
  crude_petroleum: {
    sector: "Energy",
    category: "Fuel",
    name: "Crude petroleum and natural gas",
    factor: 0.66,
    unit: "kg/gbp",
    currency: "GBP",
    description: "Emissions from crude petroleum and natural gas production",
  },
  motor_gasoline: {
    sector: "Energy",
    category: "Fuel",
    name: "Motor gasoline",
    factor: 0.6,
    unit: "kg/gbp",
    currency: "GBP",
    description: "Emissions from motor gasoline consumption",
  },

  // Agriculture Sector (EUR based)
  poultry: {
    sector: "Agriculture/Hunting/Forestry",
    category: "Livestock Farming",
    name: "Poultry",
    factor: 0.71,
    unit: "kg/eur",
    currency: "EUR",
    description: "Emissions from poultry farming operations",
  },
  wheat: {
    sector: "Agriculture/Hunting/Forestry",
    category: "Arable Farming",
    name: "Wheat",
    factor: 0.64,
    unit: "kg/eur",
    currency: "EUR",
    description: "Emissions from wheat cultivation",
  },

  // Materials Sector (USD based)
  stone: {
    sector: "Materials and Manufacturing",
    category: "Mined Materials",
    name: "Stone",
    factor: 0.58,
    unit: "kg/usd",
    currency: "USD",
    description: "Emissions from stone mining and processing",
  },

  // Consumer Goods (USD based)
  dairy_products: {
    sector: "Consumer Goods and Services",
    category: "Food/Beverages/Tobacco",
    name: "Dairy products",
    factor: 0.55,
    unit: "kg/usd",
    currency: "USD",
    description: "Emissions from dairy product manufacturing",
  },

  // Education
  education: {
    sector: "Education",
    category: "Education",
    name: "Education services",
    factor: 0.52,
    unit: "kg/gbp",
    currency: "GBP",
    description: "Emissions from educational services",
  },

  // Financial Services
  financial_services: {
    sector: "Insurance and Financial Services",
    category: "Financial Services",
    name: "Financial intermediation services",
    factor: 0.52,
    unit: "kg/gbp",
    currency: "GBP",
    description: "Emissions from financial intermediation activities",
  },
  insurance: {
    sector: "Insurance and Financial Services",
    category: "Insurance Services",
    name: "Insurance and pension funding services",
    factor: 0.52,
    unit: "kg/gbp",
    currency: "GBP",
    description: "Emissions from insurance and pension services",
  },
}

export default function TrackEmission() {
  const [date, setDate] = useState<Date>()
  const [selectedCountry, setSelectedCountry] = useState<string>("MY")
  const [emissionValue, setEmissionValue] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("crude_petroleum")
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)

  const getCountry = (code: string): Country => {
    return countries.find((country) => country.code === code) || countries[0]
  }

  // Enhanced calculation with currency conversion
  const calculateEmissions = () => {
    const template = emissionTemplates[selectedTemplate as keyof typeof emissionTemplates]
    const country = getCountry(selectedCountry)
    const value = Number.parseFloat(emissionValue) || 0

    // Convert local currency to template's base currency
    const baseValue = value * country.exchangeRates[template.currency as keyof typeof country.exchangeRates]
    const emissions = baseValue * template.factor

    return {
      localValue: value,
      localCurrency: country.currency,
      localSymbol: country.symbol,
      baseValue: baseValue.toFixed(2),
      baseCurrency: template.currency,
      factor: template.factor,
      unit: template.unit,
      total: emissions.toFixed(2),
      gasesBreakdown: (template.factor * 1.001).toFixed(3),
    }
  }

  const calculations = calculateEmissions()
  const selectedCountryData = getCountry(selectedCountry)

  // Group templates by sector
  const groupedTemplates = Object.entries(emissionTemplates).reduce(
    (acc, [key, template]) => {
      if (!acc[template.sector]) {
        acc[template.sector] = []
      }
      acc[template.sector].push({ key, ...template })
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <div className="container max-w-3xl py-6">
      <h1 className="text-2xl font-semibold mb-8">Track An Emission</h1>

      <div className="space-y-8">
        {/* Activity Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal">Provide Activity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Country Selection */}
            <div className="space-y-2">
              <Label>
                Country <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{getCountry(selectedCountry).name}</span>
                      <span className="text-muted-foreground">({getCountry(selectedCountry).currency})</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{country.name}</span>
                        <span className="text-muted-foreground">({country.currency})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>
                Select Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MM/dd/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>
                  Activity Description <span className="text-red-500">*</span>
                </Label>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <Textarea placeholder="Enter Activity Description" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Upload Files</Label>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input type="file" />
            </div>
          </CardContent>
        </Card>

        {/* Emission Template Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-normal">Choose an Emission Template</CardTitle>
            <p className="text-base text-muted-foreground mt-1">
              Select an existing template to apply to this emission activity.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select
              value={selectedTemplate}
              onValueChange={(value) => {
                setSelectedTemplate(value)
                setEmissionValue("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectedTemplate && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{emissionTemplates[selectedTemplate].name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="bg-muted px-2 py-0.5 rounded-md text-sm">
                        {emissionTemplates[selectedTemplate].category}
                      </span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm">
                        {emissionTemplates[selectedTemplate].factor} {emissionTemplates[selectedTemplate].unit}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(groupedTemplates).map(([sector, templates]) => (
                  <div key={sector} className="flex flex-col">
                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5">
                      <h3 className="font-semibold text-sm">{sector}</h3>
                    </div>
                    <div className="px-1">
                      {templates.map((template) => (
                        <SelectItem key={template.key} value={template.key} className="rounded-md focus:bg-accent">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{template.name}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="bg-muted px-2 py-0.5 rounded-md text-sm">{template.category}</span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm">
                              {template.factor} {template.unit}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </div>
                ))}
              </SelectContent>
            </Select>

            <Button variant="secondary" size="sm" onClick={() => setShowTemplateDetails(!showTemplateDetails)}>
              View details
            </Button>

            {showTemplateDetails && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{emissionTemplates[selectedTemplate].name}</p>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    {emissionTemplates[selectedTemplate].factor} {emissionTemplates[selectedTemplate].unit}
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">{emissionTemplates[selectedTemplate].description}</p>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Sector: {emissionTemplates[selectedTemplate].sector}</span>
                    <span>Category: {emissionTemplates[selectedTemplate].category}</span>
                    <span>Base Currency: {emissionTemplates[selectedTemplate].currency}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility Selection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal">
                Select a Facility <span className="text-red-500">*</span>
              </CardTitle>
              <span className="text-sm text-muted-foreground">Required</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the facility where the emission activity is taking place.
            </p>
            <Select defaultValue="glomac">
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glomac">Glomac Damansara Residences</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Enhanced Emission Consumption Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal">
                Enter Emission Consumption <span className="text-red-500">*</span>
              </CardTitle>
              <span className="text-sm text-muted-foreground">Required</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Input the amount in {selectedCountryData.currency} ({selectedCountryData.name})
              </p>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {selectedCountryData.symbol}
                </span>
                <Input
                  type="number"
                  value={emissionValue}
                  onChange={(e) => setEmissionValue(e.target.value)}
                  className="text-2xl font-medium pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-purple-600 font-medium">{emissionTemplates[selectedTemplate].name}</p>

              {/* Currency Conversion */}
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Currency Conversion</span>
                    <span className="text-muted-foreground">
                      Mid-market rate as of {format(new Date(), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-background rounded-md p-2">
                    <span>
                      {calculations.localSymbol} {calculations.localValue.toLocaleString()} {calculations.localCurrency}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span>
                      {calculations.baseCurrency} {calculations.baseValue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span>×</span>
                  <span>
                    Emission Factor: {calculations.factor} {calculations.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>=</span>
                  <span>Carbon Emission: {calculations.total} kgCO2e</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Gases Breakdown</p>
                <p className="text-sm text-muted-foreground">
                  CO2E TOTAL = {calculations.gasesBreakdown} {calculations.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-purple-600 hover:bg-purple-700">
          Submit
          <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
        </Button>
      </div>
    </div>
  )
}

