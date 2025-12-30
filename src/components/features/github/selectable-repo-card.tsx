'use client'

import { Star, GitFork, ExternalLink, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GitHubRepo } from '@/app/api/github/repos/route'

interface SelectableRepoCardProps {
  repo: GitHubRepo
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  Ruby: 'bg-red-600',
  PHP: 'bg-purple-500',
  CSS: 'bg-pink-500',
  HTML: 'bg-orange-400',
  Shell: 'bg-green-400',
  Dockerfile: 'bg-blue-400',
}

export function SelectableRepoCard({ repo, selected, onToggle, disabled }: SelectableRepoCardProps) {
  const languageColor = repo.language ? languageColors[repo.language] || 'bg-gray-400' : ''

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onToggle()}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
            {selected && (
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-3 w-3" />
              </span>
            )}
            <span className="truncate">{repo.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={repo.visibility === 'public' ? 'secondary' : 'outline'}>
              {repo.visibility}
            </Badge>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {repo.description || '설명 없음'}
        </p>

        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {repo.topics.slice(0, 4).map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {repo.topics.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{repo.topics.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {repo.language && (
            <div className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full ${languageColor}`} />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span>{repo.forks_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
