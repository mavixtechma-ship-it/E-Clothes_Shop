import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth/auth.service';
import { Category, Product, ProductInput } from '../core/models';
import { EgpPipe } from '../shared/egp.pipe';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ProductImageComponent } from '../shared/product-image.component';

const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40'];

@Component({
  selector: 'app-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    FileUploadModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
    EgpPipe,
    PageHeaderComponent,
    ProductImageComponent,
  ],
  template: `
    <app-page-header title="Products" [subtitle]="products().length + ' pieces in the catalogue'">
      @if (auth.canEdit()) {
        <p-button label="New product" icon="pi pi-plus" (onClick)="openNew()" />
      }
    </app-page-header>

    <!-- Filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <p-iconfield class="w-full sm:w-72">
        <p-inputicon styleClass="pi pi-search" />
        <input pInputText type="search" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search name or colour" aria-label="Search products" maxlength="60" class="w-full" />
      </p-iconfield>
      <p-select [options]="categoryOptions()" [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)"
        optionLabel="name" optionValue="name" placeholder="All categories" [showClear]="true" ariaLabel="Filter by category" />
      <p-select [options]="stockOptions" [ngModel]="stockFilter()" (ngModelChange)="stockFilter.set($event)"
        optionLabel="label" optionValue="value" placeholder="Any stock" [showClear]="true" ariaLabel="Filter by stock" />
    </div>

    <div class="ll-card overflow-hidden">
      <p-table
        [value]="filtered()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 25, 50]"
        sortField="id"
        [sortOrder]="1"
        dataKey="id"
        [scrollable]="true"
        [tableStyle]="{ 'min-width': '52rem' }"
        size="small"
      >
        <ng-template #header>
          <tr>
            <th scope="col" class="w-20">Image</th>
            <th scope="col" pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th scope="col" pSortableColumn="category">Category <p-sortIcon field="category" /></th>
            <th scope="col" pSortableColumn="price" class="!text-right">Price <p-sortIcon field="price" /></th>
            <th scope="col" pSortableColumn="stock" class="!text-right">Stock <p-sortIcon field="stock" /></th>
            <th scope="col">Featured</th>
            <th scope="col" class="w-28 !text-right"><span class="sr-only">Actions</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-p>
          <tr>
            <td><app-product-image class="w-12" [url]="p.images.at(0)?.url" [alt]="p.name" [color]="p.colorHex" /></td>
            <td>
              <div class="font-semibold">{{ p.name }}</div>
              <div class="flex items-center gap-1.5 text-xs text-muted">
                <span class="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-[var(--ll-border)]" [style.background]="p.colorHex"></span>{{ p.colorName }}
              </div>
            </td>
            <td>{{ p.category }}</td>
            <td class="num !text-right">{{ p.price | egp }}</td>
            <td class="!text-right">
              @if (p.stock === 0) {
                <p-tag value="Sold out" severity="danger" />
              } @else if (p.stock <= 5) {
                <p-tag [value]="'' + p.stock" severity="warn" icon="pi pi-exclamation-triangle" />
              } @else {
                <span class="num">{{ p.stock }}</span>
              }
            </td>
            <td>
              @if (p.featured) {
                <p-tag value="Featured" icon="pi pi-star-fill" severity="info" />
              }
            </td>
            <td class="!text-right whitespace-nowrap">
              @if (auth.canEdit()) {
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'Edit ' + p.name" pTooltip="Edit" (onClick)="openEdit(p)" />
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" [ariaLabel]="'Delete ' + p.name" pTooltip="Delete" (onClick)="confirmDelete(p)" />
              } @else {
                <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'View ' + p.name" pTooltip="View" (onClick)="openEdit(p)" />
              }
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="7" class="py-10 text-center text-muted">No products match these filters.</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Create / edit dialog -->
    <p-dialog
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(46rem, 96vw)' }"
      [header]="!auth.canEdit() ? 'Product details' : editing() ? 'Edit product' : 'New product'"
    >
      <form [formGroup]="form" class="grid gap-4 sm:grid-cols-2" (ngSubmit)="save()" novalidate id="product-form">
        <label class="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
          Name
          <input pInputText formControlName="name" maxlength="80" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Category
          <p-select formControlName="categoryId" [options]="categories()" optionLabel="name" optionValue="id" appendTo="body" ariaLabel="Category" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Price (EGP)
          <p-inputnumber formControlName="price" [min]="1" [max]="200000" [useGrouping]="true" ariaLabel="Price" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Colour name
          <input pInputText formControlName="colorName" maxlength="40" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Colour hex
          <span class="flex items-center gap-2">
            <span class="h-9 w-9 shrink-0 rounded-md ring-1 ring-[var(--ll-border)]" [style.background]="swatch()"></span>
            <input pInputText formControlName="colorHex" maxlength="7" placeholder="#233150" class="flex-1" />
          </span>
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Sizes
          <p-multiselect formControlName="sizes" [options]="sizeOptions" appendTo="body" display="chip" ariaLabel="Sizes" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          Units in stock
          <p-inputnumber formControlName="stock" [min]="0" [max]="99999" ariaLabel="Stock" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
          Material
          <input pInputText formControlName="material" maxlength="120" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
          Description
          <textarea pTextarea formControlName="description" rows="3" maxlength="1000"></textarea>
        </label>
        <label class="flex items-center gap-3 text-sm font-semibold">
          <p-toggleswitch formControlName="featured" ariaLabel="Featured" /> Feature on the home page
        </label>
        @if (formError()) {
          <p class="text-sm text-err sm:col-span-2">{{ formError() }}</p>
        }
      </form>

      @if (editing(); as p) {
        <section class="mt-6 border-t border-line pt-5" aria-labelledby="img-h">
          <h3 id="img-h" class="mb-3 text-sm font-semibold">Images</h3>
          <div class="flex flex-wrap gap-3">
            @for (img of p.images; track img.id) {
              <div class="relative w-24">
                <app-product-image [url]="img.url" [alt]="p.name" />
                @if (auth.canEdit()) {
                  <p-button icon="pi pi-times" [rounded]="true" severity="danger" size="small" styleClass="!absolute -right-2 -top-2 !h-7 !w-7"
                    ariaLabel="Remove image" (onClick)="removeImage(p, img.id)" />
                }
              </div>
            } @empty {
              <p class="text-sm text-muted">No images yet.</p>
            }
          </div>
          @if (auth.canEdit()) {
            <p-fileupload
              mode="advanced"
              name="file"
              accept="image/png,image/jpeg,image/webp"
              [maxFileSize]="2097152"
              [multiple]="true"
              [customUpload]="true"
              [auto]="false"
              chooseLabel="Choose images"
              uploadLabel="Upload"
              cancelLabel="Clear"
              invalidFileSizeMessageSummary="{0}: too large,"
              invalidFileSizeMessageDetail="maximum is {0}."
              invalidFileTypeMessageSummary="{0}: unsupported type,"
              invalidFileTypeMessageDetail="use PNG, JPEG or WebP."
              (uploadHandler)="upload(p, $event)"
              styleClass="mt-4"
            >
              <ng-template #empty>
                <div class="py-4 text-center text-sm text-muted">Drag PNG, JPEG or WebP files here (max 2 MB each).</div>
              </ng-template>
            </p-fileupload>
          }
        </section>
      }

      <ng-template #footer>
        <p-button label="Close" severity="secondary" [text]="true" (onClick)="dialogOpen.set(false)" />
        @if (auth.canEdit()) {
          <p-button type="submit" form="product-form" [label]="editing() ? 'Save changes' : 'Create product'" icon="pi pi-check" [loading]="saving()" />
        }
      </ng-template>
    </p-dialog>
  `,
})
export class ProductsPage {
  private api = inject(ApiService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  protected auth = inject(AuthService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);

  search = signal('');
  categoryFilter = signal<string | null>(null);
  stockFilter = signal<'low' | 'out' | 'ok' | null>(null);
  stockOptions = [
    { label: 'Low (≤ 5)', value: 'low' },
    { label: 'Sold out', value: 'out' },
    { label: 'Healthy', value: 'ok' },
  ];
  categoryOptions = computed(() => this.categories());
  sizeOptions = [...TOP_SIZES, ...BOTTOM_SIZES];

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.categoryFilter();
    const stock = this.stockFilter();
    return this.products().filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || (p.colorName ?? '').toLowerCase().includes(q)) &&
        (!cat || p.category === cat) &&
        (!stock || (stock === 'out' ? p.stock === 0 : stock === 'low' ? p.stock > 0 && p.stock <= 5 : p.stock > 5)),
    );
  });

  dialogOpen = signal(false);
  editing = signal<Product | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    categoryId: [1, Validators.required],
    price: [1000, [Validators.required, Validators.min(1), Validators.max(200000)]],
    colorName: ['', Validators.maxLength(40)],
    colorHex: ['#233150', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    sizes: [['S', 'M', 'L'] as string[], Validators.required],
    stock: [10, [Validators.required, Validators.min(0), Validators.max(99999)]],
    material: ['', Validators.maxLength(120)],
    description: ['', Validators.maxLength(1000)],
    featured: [false],
  });
  private hex = signal('#233150');
  swatch = computed(() => (/^#[0-9a-fA-F]{6}$/.test(this.hex()) ? this.hex() : 'transparent'));

  constructor() {
    this.form.controls.colorHex.valueChanges.subscribe((v) => this.hex.set(v));
    this.reload();
  }

  reload(): void {
    forkJoin({ products: this.api.getProducts(), categories: this.api.getCategories() }).subscribe({
      next: ({ products, categories }) => {
        this.products.set(products);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.add({ severity: 'error', summary: 'Could not load products' });
      },
    });
  }

  openNew(): void {
    if (!this.auth.canEdit()) return;
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset();
    this.form.enable();
    this.dialogOpen.set(true);
  }

  openEdit(p: Product): void {
    this.editing.set(p);
    this.formError.set(null);
    this.form.reset({
      name: p.name,
      categoryId: p.categoryId,
      price: p.price,
      colorName: p.colorName ?? '',
      colorHex: p.colorHex,
      sizes: [...p.sizes],
      stock: p.stock,
      material: p.material ?? '',
      description: p.description ?? '',
      featured: p.featured,
    });
    if (this.auth.canEdit()) this.form.enable();
    else this.form.disable();
    this.dialogOpen.set(true);
  }

  save(): void {
    if (!this.auth.canEdit()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Check the highlighted fields: name, a #RRGGBB colour and at least one size are required.');
      return;
    }
    const v = this.form.getRawValue();
    const body: ProductInput = {
      ...v,
      name: v.name.trim(),
      colorHex: v.colorHex.toUpperCase(),
      colorName: v.colorName.trim() || undefined,
      material: v.material.trim() || undefined,
      description: v.description.trim() || undefined,
    };
    const current = this.editing();
    this.saving.set(true);
    (current ? this.api.updateProduct(current.id, body) : this.api.createProduct(body)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.products.update((list) => (current ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
        this.toast.add({ severity: 'success', summary: current ? 'Product updated' : 'Product created', detail: saved.name });
        if (current) this.dialogOpen.set(false);
        else this.editing.set(saved); // stay open so images can be added
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.formError.set(this.message(e));
      },
    });
  }

  confirmDelete(p: Product): void {
    this.confirm.confirm({
      header: 'Delete product?',
      message: `“${p.name}” will be removed from the catalogue. This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Keep',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.api.deleteProduct(p.id).subscribe({
          next: () => {
            this.products.update((list) => list.filter((x) => x.id !== p.id));
            this.toast.add({ severity: 'success', summary: 'Product deleted', detail: p.name });
          },
          error: (e: unknown) => this.toast.add({ severity: 'error', summary: 'Delete failed', detail: this.message(e) }),
        }),
    });
  }

  upload(p: Product, event: FileUploadHandlerEvent): void {
    const files = event.files.slice(0, 6);
    forkJoin(files.map((f) => this.api.uploadImage(p.id, f))).subscribe({
      next: (images) => {
        const updated = { ...p, images: [...p.images, ...images] };
        this.editing.set(updated);
        this.products.update((list) => list.map((x) => (x.id === p.id ? updated : x)));
        this.toast.add({ severity: 'success', summary: `${images.length} image(s) uploaded` });
      },
      error: (e: unknown) => this.toast.add({ severity: 'error', summary: 'Upload failed', detail: this.message(e) }),
    });
  }

  removeImage(p: Product, imageId: number): void {
    this.api.deleteImage(p.id, imageId).subscribe({
      next: () => {
        const updated = { ...p, images: p.images.filter((i) => i.id !== imageId) };
        this.editing.set(updated);
        this.products.update((list) => list.map((x) => (x.id === p.id ? updated : x)));
      },
      error: (e: unknown) => this.toast.add({ severity: 'error', summary: 'Could not remove image', detail: this.message(e) }),
    });
  }

  private message(e: unknown): string {
    if (e instanceof HttpErrorResponse && e.status < 500 && typeof e.error?.message === 'string') return e.error.message;
    return 'Something went wrong.';
  }
}
