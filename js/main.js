// Global variables
let siteData = {};
let productsData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSiteData();
    loadProducts();
    setupContactButtons();
});

// Load site configuration data
async function loadSiteData() {
    try {
        const response = await fetch('/content/site.md');
        const text = await response.text();
        siteData = parseFrontMatter(text);
        applySiteData();
    } catch (error) {
        console.error('Error loading site data:', error);
        // Use default values if site.md doesn't exist
        siteData = {
            title: 'Fashion Studio',
            description: 'Elegant Fashion Designs',
            hero_title: 'Elegant Fashion Designs',
            hero_description: 'Discover unique and sophisticated fashion pieces crafted with passion and attention to detail.',
            about_title: 'About Our Studio',
            about_description: 'We are passionate about creating timeless fashion pieces that combine style, comfort, and quality.',
            primary_color: '#0d6efd',
            secondary_color: '#6c757d',
            whatsapp_number: '+918879403922',
            instagram_id: 'qwiktech.in'
        };
        applySiteData();
    }
}

// Apply site data to the page
function applySiteData() {
    // Update page title
    const titleElement = document.querySelector('title');
    if (titleElement && siteData.title) {
        titleElement.textContent = siteData.title;
    }

    // Update navigation brand
    const navBrand = document.getElementById('site-title');
    if (navBrand && siteData.title) {
        navBrand.textContent = siteData.title;
    }

    // Update hero section
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && siteData.hero_title) {
        heroTitle.textContent = siteData.hero_title;
    }

    const heroDescription = document.getElementById('hero-description');
    if (heroDescription && siteData.hero_description) {
        heroDescription.textContent = siteData.hero_description;
    }

    // Update about section
    const aboutTitle = document.getElementById('about-title');
    if (aboutTitle && siteData.about_title) {
        aboutTitle.textContent = siteData.about_title;
    }

    const aboutDescription = document.getElementById('about-description');
    if (aboutDescription && siteData.about_description) {
        aboutDescription.textContent = siteData.about_description;
    }

    // Update CSS custom properties
    if (siteData.primary_color) {
        document.documentElement.style.setProperty('--primary-color', siteData.primary_color);
    }
    if (siteData.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', siteData.secondary_color);
    }

    // Update footer elements
    updateFooterContent();
}

// Load products data
async function loadProducts() {
    try {
        // In a real implementation, this would fetch from the content/products directory
        // For now, we'll check if there are any product files
        productsData = await fetchProductsFromDirectory();
        displayProducts();
        displayFeaturedProducts();
        
        // Set up automatic refresh for new products (check every 5 minutes for better performance)
        if (!window.productRefreshInterval) {
            window.productRefreshInterval = setInterval(async () => {
                const newProducts = await fetchProductsFromDirectory();
                if (newProducts.length !== productsData.length) {
                    console.log('New products detected, refreshing...');
                    productsData = newProducts;
                    displayProducts();
                    displayFeaturedProducts();
                }
            }, 300000);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNoProductsMessage();
    }
}

// Fetch products from content directory
async function fetchProductsFromDirectory() {
    const products = [];
    
    try {
        // First, try to get directory listing via a known endpoint
        // Since we can't directly list directory contents in a static environment,
        // we'll use a more robust approach by trying common product files
        // and also checking for any new files that might have been added
        
        const potentialFiles = [
            'elegant-silk-saree.md',
            'designer-cotton-kurti.md', 
            'embroidered-blouse.md',
            'festive-georgette-saree.md',
            'ethnic-printed-kurti.md',
            'silk-designer-blouse.md',
            'test-multi-image-saree.md',
            'admin-test-product.md'
        ];
        
        // Try to fetch a directory index if available
        try {
            const indexResponse = await fetch('/content/products/');
            if (indexResponse.ok) {
                const indexText = await indexResponse.text();
                console.log('Directory listing available, parsing for .md files');
                
                // Parse HTML directory listing to find .md files
                const matches = indexText.match(/href="([^"]*\.md)"/g);
                if (matches) {
                    const foundFiles = matches.map(match => match.match(/href="([^"]*)"/)[1])
                        .filter(file => file.endsWith('.md') && !file.includes('/') && file !== '.gitkeep');
                    
                    console.log('Found .md files in directory:', foundFiles);
                    
                    // Replace potential files with actually discovered files
                    potentialFiles.length = 0; // Clear the array
                    potentialFiles.push(...foundFiles);
                } else {
                    console.log('No .md files found in directory listing');
                }
            }
        } catch (indexError) {
            console.log('Directory listing not available, using known files');
        }
        
        // Try to fetch each potential product file
        for (const file of potentialFiles) {
            try {
                const response = await fetch(`/content/products/${file}`);
                if (response.ok) {
                    const text = await response.text();
                    const product = parseFrontMatter(text);
                    console.log(`Parsing ${file}:`, {
                        title: product.title,
                        draft: product.draft,
                        hasTitle: !!product.title,
                        isDraft: !!product.draft
                    });
                    
                    if (product.title && !product.draft) {
                        // Add filename for URL generation
                        product.slug = file.replace('.md', '');
                        
                        // Process gallery images array properly
                        if (product.gallery && typeof product.gallery === 'string') {
                            // Handle case where gallery is stored as a string in YAML
                            try {
                                product.gallery = JSON.parse(product.gallery);
                            } catch (e) {
                                // If it's not JSON, treat as single item array
                                product.gallery = [product.gallery];
                            }
                        } else if (!Array.isArray(product.gallery)) {
                            product.gallery = [];
                        }
                        
                        products.push(product);
                        console.log(`Added product: ${product.title}`);
                    } else {
                        console.log(`Skipping ${file}: ${!product.title ? 'no title' : 'is draft'}`);
                    }
                }
            } catch (err) {
                console.log(`Product file ${file} not found, skipping`);
            }
        }
        
        // For new products added via admin panel, we rely on the directory listing
        // No need to scan for hypothetical files that cause 404 errors
        
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    
    return products;
}

// Helper function to try fetching a product file
async function tryFetchProduct(filename, products) {
    try {
        const response = await fetch(`/content/products/${filename}`);
        if (response.ok) {
            const text = await response.text();
            const product = parseFrontMatter(text);
            if (product.title && !product.draft) {
                product.slug = filename.replace('.md', '');
                
                // Process gallery images
                if (product.gallery && typeof product.gallery === 'string') {
                    try {
                        product.gallery = JSON.parse(product.gallery);
                    } catch (e) {
                        product.gallery = [product.gallery];
                    }
                } else if (!Array.isArray(product.gallery)) {
                    product.gallery = [];
                }
                
                products.push(product);
            }
        }
    } catch (err) {
        // Silently skip non-existent files
    }
}

// Parse front matter from markdown files
function parseFrontMatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) {
        console.log('No frontmatter found in content');
        return {};
    }
    
    const frontMatter = match[1];
    const body = match[2];
    
    console.log('Parsing frontmatter:', frontMatter.substring(0, 200) + '...');
    
    const data = {};
    const lines = frontMatter.split('\n');
    let currentArray = null;
    let currentKey = null;
    
    try {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Handle array items (lines starting with -)
            if (line.startsWith('- ')) {
                if (currentArray && currentKey) {
                    let arrayValue = line.substring(2).trim();
                    // Remove quotes if present
                    if ((arrayValue.startsWith('"') && arrayValue.endsWith('"')) || 
                        (arrayValue.startsWith("'") && arrayValue.endsWith("'"))) {
                        arrayValue = arrayValue.slice(1, -1);
                    }
                    currentArray.push(arrayValue);
                }
                continue;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Check if this is an array field (value is empty or contains array indicator)
                if (!value || value === '[]' || (i + 1 < lines.length && lines[i + 1].trim().startsWith('- '))) {
                    currentArray = [];
                    currentKey = key;
                    data[key] = currentArray;
                    continue;
                } else {
                    // Reset array tracking for regular fields
                    currentArray = null;
                    currentKey = null;
                }
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // Parse booleans and numbers
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
                
                data[key] = value;
            }
        }
        
        console.log('Parsed data:', data);
        
    } catch (error) {
        console.error('Error parsing frontmatter:', error);
        return {};
    }
    
    if (body) data.body = body.trim();
    return data;
}

// Display products on products page
function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    console.log(`Displaying products: ${productsData.length} products loaded`);
    console.log('Products data:', productsData.map(p => ({title: p.title, slug: p.slug, draft: p.draft})));

    if (productsData.length === 0) {
        console.log('No products to display, showing no products message');
        showNoProductsMessage();
        return;
    }

    productsGrid.innerHTML = '';
    
    productsData.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Display featured products on homepage
function displayFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;

    let featuredProducts = productsData.filter(product => product.featured === true);
    
    if (featuredProducts.length === 0) {
        // Show first 3 products if no featured products
        featuredProducts = productsData.slice(0, 3);
    }

    featuredContainer.innerHTML = '';
    
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredContainer.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category || 'uncategorized';
    card.dataset.slug = product.slug || product.title;
    card.style.cursor = 'pointer';
    
    // Make entire card clickable
    card.addEventListener('click', function() {
        window.location.href = `product-detail.html?product=${encodeURIComponent(product.slug || product.title)}`;
    });
    
    // Image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'product-image position-relative';
    
    if (product.image) {
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.title;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        };
        imageDiv.appendChild(img);
    } else {
        imageDiv.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 bg-light"><i class="fas fa-image fa-3x text-muted"></i></div>';
    }
    
    // Remove availability badge from top of card
    
    // Featured badge
    if (product.featured) {
        const featuredBadge = document.createElement('div');
        featuredBadge.className = 'featured-badge';
        featuredBadge.textContent = 'Featured';
        imageDiv.appendChild(featuredBadge);
    }
    
    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'product-card-body';
    
    // Category
    if (product.category) {
        const category = document.createElement('span');
        category.className = 'product-category';
        category.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        cardBody.appendChild(category);
    }
    
    // Title
    const title = document.createElement('h5');
    title.className = 'product-title';
    title.textContent = product.title || 'Untitled Product';
    cardBody.appendChild(title);
    
    // Price
    if (product.price) {
        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = `₹${product.price}`;
        cardBody.appendChild(price);
    }
    
    // Availability status with modern design
    const availability = document.createElement('div');
    availability.className = 'availability-status';
    availability.innerHTML = product.available ? 
        '<span class="availability-dot available-dot"></span> In Stock' : 
        '<span class="availability-dot unavailable-dot"></span> Out of Stock';
    cardBody.appendChild(availability);
    
    // Description
    if (product.description) {
        const description = document.createElement('p');
        description.className = 'product-description';
        description.textContent = product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '');
        cardBody.appendChild(description);
    }
    
    // Optional: Add a subtle indicator that the card is clickable
    const clickIndicator = document.createElement('small');
    clickIndicator.className = 'text-muted mt-auto';
    clickIndicator.innerHTML = '<i class="fas fa-eye"></i> Click to view details';
    cardBody.appendChild(clickIndicator);
    
    card.appendChild(imageDiv);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

// Show no products message
function showNoProductsMessage() {
    const productsGrid = document.getElementById('products-grid');
    const noProductsMsg = document.getElementById('no-products');
    
    if (productsGrid) {
        productsGrid.innerHTML = '';
    }
    
    if (noProductsMsg) {
        noProductsMsg.style.display = 'block';
    }
}

// Setup contact buttons
function setupContactButtons() {
    const whatsappContact = document.getElementById('whatsapp-contact');
    const instagramContact = document.getElementById('instagram-contact');
    
    if (whatsappContact) {
        whatsappContact.addEventListener('click', function(e) {
            e.preventDefault();
            const message = encodeURIComponent('Hello! I would like to know more about your fashion collection.');
            const whatsappUrl = `https://wa.me/${siteData.whatsapp_number || '+918879403922'}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        });
    }
    
    if (instagramContact) {
        instagramContact.addEventListener('click', function(e) {
            e.preventDefault();
            const instagramUrl = `https://instagram.com/${siteData.instagram_id || 'qwiktech.in'}`;
            window.open(instagramUrl, '_blank');
        });
    }
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(price);
}

// Update footer content with site data
function updateFooterContent() {
    // Update footer brand
    const footerSiteTitle = document.getElementById('footer-site-title');
    if (footerSiteTitle && siteData.title) {
        footerSiteTitle.textContent = siteData.title;
    }

    // Update footer description
    const footerDescription = document.getElementById('footer-description');
    if (footerDescription && siteData.description) {
        footerDescription.textContent = siteData.description;
    }

    // Update footer copyright brand
    const footerCopyrightBrand = document.getElementById('footer-copyright-brand');
    if (footerCopyrightBrand && siteData.title) {
        footerCopyrightBrand.textContent = siteData.title;
    }

    // Update footer phone
    const footerPhone = document.getElementById('footer-phone');
    if (footerPhone && siteData.whatsapp_number) {
        footerPhone.textContent = siteData.whatsapp_number;
    }

    // Update footer WhatsApp link
    const footerWhatsapp = document.getElementById('footer-whatsapp');
    if (footerWhatsapp && siteData.whatsapp_number) {
        const message = 'Hello! I am interested in your fashion collection.';
        footerWhatsapp.href = `https://wa.me/${siteData.whatsapp_number}?text=${encodeURIComponent(message)}`;
    }

    // Update footer Instagram link
    const footerInstagram = document.getElementById('footer-instagram');
    if (footerInstagram && siteData.instagram_id) {
        footerInstagram.href = `https://instagram.com/${siteData.instagram_id}`;
    }
}
