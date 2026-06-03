import { Card, CardContent } from "@/components/ui/card"
import { ChevronUp, ChevronDown } from "lucide-react"

type StatCardProps = {
  title: string
  current: string
  previous: string
  percentage: string
}

export default function StatCard({
  title,
  current,
  previous,
  percentage
}: StatCardProps) {

  const isPositive = percentage?.startsWith("+") ?? true

  return (
    <Card className="overflow-hidden group border px-5 bg-primary/30 dark:bg-card rounded-none">
      <CardContent className="flex flex-col items-center p-0">
        <div className="w-full flex flex-col">
          <div className="p-4 text-center">
            <p className="text-lg leading-7 mb-5">{title}</p>

            <div className="flex items-center justify-between">
              <h4 className="text-3xl font-semibold">{current}</h4>

              <div className="flex flex-col items-center">
                <p
                  className={`text-2xl flex items-center gap-1 ${
                    isPositive ? "text-green-800" : "text-red-600"
                  }`}
                >
                  {percentage}
                  {isPositive ? <ChevronUp /> : <ChevronDown />}
                </p>

                <p className="text-gray-400">{previous}</p>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}