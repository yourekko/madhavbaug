import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Tracks when a viewer last contributed to `questions.view_count` for deduplication
 * (same viewer refreshing should not inflate counts).
 */
@Entity('forum_question_view_dedupe')
@Index(['questionId', 'viewerKey'], { unique: true })
export class ForumQuestionViewDedupe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'question_id', type: 'char', length: 36 })
  questionId!: string;

  /** Stable opaque key, e.g. `v:<uuid>` from client header or `n:<sha256-slice>` fallback. */
  @Column({ name: 'viewer_key', type: 'varchar', length: 256 })
  viewerKey!: string;

  @Column({ name: 'last_counted_at', type: 'datetime' })
  lastCountedAt!: Date;
}
