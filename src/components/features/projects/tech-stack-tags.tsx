'use client'

import { Badge } from '@/components/ui/badge'
import { getLanguageColor } from '@/hooks/use-project-metadata'

interface TechStackTagsProps {
  techStack: string[]
  language?: string | null
  topics?: string[]
  maxTags?: number
  showAll?: boolean
}

export function TechStackTags({
  techStack = [],
  language,
  topics = [],
  maxTags = 5,
  showAll = false,
}: TechStackTagsProps) {
  // 모든 태그 합치기 (중복 제거)
  const allTags = new Set<string>()

  // 언어 먼저 추가
  if (language) {
    allTags.add(language)
  }

  // GitHub topics 추가
  topics.forEach((topic) => allTags.add(topic))

  // 수동 입력된 tech_stack 추가
  techStack.forEach((tech) => allTags.add(tech))

  const tagsArray = Array.from(allTags)
  const displayTags = showAll ? tagsArray : tagsArray.slice(0, maxTags)
  const remainingCount = tagsArray.length - displayTags.length

  if (tagsArray.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => {
        const isLanguage = tag === language
        const color = isLanguage ? getLanguageColor(language) : undefined

        return (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs font-normal"
            style={
              isLanguage
                ? {
                    backgroundColor: `${color}20`,
                    color: color,
                    borderColor: `${color}40`,
                  }
                : undefined
            }
          >
            {isLanguage && (
              <span
                className="w-2 h-2 rounded-full mr-1.5 inline-block"
                style={{ backgroundColor: color }}
              />
            )}
            {tag}
          </Badge>
        )
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
