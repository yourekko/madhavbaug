import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('seo_pages')
export class SeoPage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 140 })
  slug!: string;

  @Column({ name: 'page_type', length: 60 })
  pageType!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription!: string | null;

  @Column({ name: 'canonical_url', type: 'varchar', nullable: true, length: 500 })
  canonicalUrl!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 80 })
  robots!: string | null;

  @Column({ name: 'og_title', type: 'varchar', nullable: true, length: 180 })
  ogTitle!: string | null;

  @Column({ name: 'og_description', nullable: true, type: 'text' })
  ogDescription!: string | null;

  /** Comma-separated SEO keywords for forum Q&A pages (admin-managed). */
  @Column({ type: 'text', nullable: true })
  keywords!: string | null;

  /** Primary focus keyword for on-page SEO checks. */
  @Column({ name: 'focus_keyword', type: 'varchar', nullable: true, length: 120 })
  focusKeyword!: string | null;

  /** JSON array of internal forum paths for related/internal linking. */
  @Column({ name: 'internal_links', type: 'text', nullable: true })
  internalLinks!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true, length: 120 })
  updatedBy!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
