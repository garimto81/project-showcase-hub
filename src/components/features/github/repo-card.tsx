'use client'

import { Star, GitFork, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GitHubRepo } from '@/app/api/github/repos/route'

interface RepoCardProps {
  repo: GitHubRepo
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

export function RepoCard({ repo }: RepoCardProps) {
  const languageColor = repo.language ? languageColors[repo.language] || 'bg-gray-400' : ''

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold truncate">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary flex items-center gap-1"
            >
              {repo.name}
              <ExternalLink className="h-4 w-4 opacity-50" />
            </a>
          </CardTitle>
          <Badge variant={repo.visibility === 'public' ? 'secondary' : 'outline'}>
            {repo.visibility}
          </Badge>
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
