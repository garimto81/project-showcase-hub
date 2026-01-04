// MVP 추가 타입
export type AppType = 'web_app' | 'pwa' | 'api' | 'docker'
export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error'
export type ProjectStatus = 'active' | 'maintained' | 'archived' | 'unknown'

export interface ScanResult {
  totalRepos: number
  scannedRepos: number
  detectedApps: DetectedApp[]
  skippedRepos: string[]
  errors: ScanError[]
}

export interface DetectedApp {
  repoFullName: string
  repoName: string
  description: string | null
  url: string
  source: DeploymentSource
  confidence: 'high' | 'medium' | 'low'
  thumbnailUrl: string | null
}

export type DeploymentSource =
  | 'github_homepage'
  | 'github_pages'
  | 'github_environments'
  | 'readme_link'
  | 'readme_badge'
  | 'url_inference'

export interface ScanError {
  repo: string
  error: string
}

export interface ScanProgress {
  status: ScanStatus
  currentRepo: string | null
  scannedCount: number
  totalCount: number
  detectedApps: DetectedApp[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_id: string | null // nullable - 단일 사용자 시스템
          thumbnail_url: string | null
          created_at: string
          updated_at: string
          // MVP 추가 필드
          url: string | null
          app_type: AppType
          is_favorite: boolean
          github_repo: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_id: string | null // nullable - 단일 사용자 시스템
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
          // MVP 추가 필드
          url?: string | null
          app_type?: AppType
          is_favorite?: boolean
          github_repo?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          // MVP 추가 필드
          url?: string | null
          app_type?: AppType
          is_favorite?: boolean
          github_repo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      ratings: {
        Row: {
          id: string
          project_id: string
          user_id: string | null // nullable - 익명 사용자 지원
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null // nullable - 익명 사용자 지원
          score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          project_id: string
          user_id: string | null // nullable - 익명 사용자 지원
          content: string
          author_name: string | null // 익명 작성자 이름
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null // nullable - 익명 사용자 지원
          content: string
          author_name?: string | null // 익명 작성자 이름
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      project_metadata: {
        Row: {
          id: string
          project_id: string
          tech_stack: string[]
          screenshots: string[]
          status: ProjectStatus
          github_stars: number
          github_forks: number
          github_language: string | null
          github_topics: string[]
          github_last_pushed_at: string | null
          github_last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          tech_stack?: string[]
          screenshots?: string[]
          status?: ProjectStatus
          github_stars?: number
          github_forks?: number
          github_language?: string | null
          github_topics?: string[]
          github_last_pushed_at?: string | null
          github_last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tech_stack?: string[]
          screenshots?: string[]
          status?: ProjectStatus
          github_stars?: number
          github_forks?: number
          github_language?: string | null
          github_topics?: string[]
          github_last_pushed_at?: string | null
          github_last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_metadata_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {}
  }
}

// 편의를 위한 타입 별칭
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type ProjectMetadata = Database['public']['Tables']['project_metadata']['Row']

// 프로필 정보가 포함된 타입
export type ProjectWithProfile = Project & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

// 메타데이터가 포함된 프로젝트 타입
export type ProjectWithMetadata = ProjectWithProfile & {
  project_metadata: ProjectMetadata | null
}

export type RatingWithProfile = Rating & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
}

export type CommentWithProfile = Comment & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
}
