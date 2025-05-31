import { getAllQnA } from "../actions"
import { Glossary } from "@/components/glossary"

export default async function GlossaryPage() {
  const allQnA = await getAllQnA()
  return <Glossary entries={allQnA} />
}

