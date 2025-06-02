"use client"

import type React from "react"
import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, ChevronRight } from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQSectionProps {
  className?: string
}

/**
 * FAQ Section component that displays frequently asked questions
 * about supply chain topics in an expandable accordion format
 */
export function FAQSection({ className = "" }: FAQSectionProps) {
  // Static FAQ data - in a real app this might come from a database
  const faqItems: FAQItem[] = [
    {
      id: "1",
      question: "What is supply chain management?",
      answer: "Supply chain management is the oversight of materials, information, and finances as they move from supplier to manufacturer to wholesaler to retailer to consumer. It involves coordinating and integrating these flows both within and among companies."
    },
    {
      id: "2", 
      question: "What are the key components of a supply chain?",
      answer: "The key components include: suppliers, manufacturers, distributors, retailers, and customers. Additional elements include transportation, warehousing, inventory management, demand planning, and information systems."
    },
    {
      id: "3",
      question: "What is the difference between logistics and supply chain management?",
      answer: "Logistics focuses on the transportation and storage of goods, while supply chain management encompasses the entire network of relationships and processes from raw materials to end customers, including logistics as one component."
    },
    {
      id: "4",
      question: "What are common supply chain challenges?",
      answer: "Common challenges include demand forecasting, inventory optimization, supplier relationship management, cost control, quality assurance, risk management, sustainability concerns, and technology integration."
    },
    {
      id: "5",
      question: "How does technology impact supply chain management?",
      answer: "Technology enables real-time visibility, automation, predictive analytics, improved communication, and better decision-making. Key technologies include IoT sensors, AI/ML, blockchain, cloud computing, and ERP systems."
    },
    {
      id: "6",
      question: "What is supply chain visibility?",
      answer: "Supply chain visibility refers to the ability to track and monitor products, components, and information throughout the entire supply chain network in real-time, enabling better decision-making and risk management."
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqItems.map((item) => (
          <AccordionItem 
            key={item.id} 
            value={item.id}
            className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <AccordionTrigger className="px-6 py-4 text-left font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-90">
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                <span>{item.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-2">
              <div className="text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-6 p-4 bg-muted/20 rounded-lg border">
        <p className="text-sm text-muted-foreground text-center">
          Have a specific question? Use the AI conversation above to get personalized answers about supply chain topics.
        </p>
      </div>
    </div>
  )
} 