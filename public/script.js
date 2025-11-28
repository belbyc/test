let readyStatus = document.querySelector('#readyStatus')
let notReadyStatus = document.querySelector('#notReadyStatus')
let myForm = document.querySelector('#myForm')
let contentArea = document.querySelector('#contentArea')
let formDialog = document.querySelector('#formDialog')
let createButton = document.querySelector('#createButton')
let saveButton = document.querySelector('#saveButton')
let cancelButton = document.querySelector('#cancelButton')
let formHeading = document.querySelector('.modal-header h2')

// Links management
let links = []
const linksInput = document.querySelector('#linksInput')
const addLinkButton = document.querySelector('#addLinkButton')
const linksContainer = document.querySelector('#linksContainer')
const linksField = document.querySelector('#linksField')

// Add link when button clicked
addLinkButton.addEventListener('click', () => {
    const linkUrl = linksInput.value.trim()
    
    if (linkUrl === '') return
    
    links.push(linkUrl)
    linksInput.value = ''
    renderLinks()
})

// Allow Enter key to add link
linksInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        addLinkButton.click()
    }
})

// Display links
const renderLinks = () => {
    linksContainer.innerHTML = ''
    links.forEach((link, index) => {
        const div = document.createElement('div')
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f0f0f0; border-radius: 4px; margin-bottom: 5px;'
        div.innerHTML = `
            <a href="${link}" target="_blank" style="color: #0066cc; text-decoration: none; word-break: break-all;">${link}</a>
            <button type="button" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Remove</button>
        `
        div.querySelector('button').addEventListener('click', () => removeLink(index))
        linksContainer.appendChild(div)
    })
    // Update hidden field
    linksField.value = JSON.stringify(links)
}

// Remove a link
const removeLink = (index) => {
    links.splice(index, 1)
    renderLinks()
}

// Get form data and process each type of input
const getFormData = () => {
    const formData = new FormData(myForm)
    const json = Object.fromEntries(formData)

    // Handle checkboxes and convert to boolean (skip parking checkboxes)
    myForm.querySelectorAll('input[type="checkbox"]').forEach(el => {
        if (el.name !== 'freeParking' && el.name !== 'paidParking' && el.name !== 'noParking') {
            json[el.name] = el.checked
        }
    })

    // Handle parking checkboxes separately
    const freeParking = myForm.querySelector('input[name="freeParking"]')
    const paidParking = myForm.querySelector('input[name="paidParking"]')
    const noParking = myForm.querySelector('input[name="noParking"]')

    if (freeParking && freeParking.checked) {
        json.parkingType = 'free'
    } else if (paidParking && paidParking.checked) {
        json.parkingType = 'paid'
    } else if (noParking && noParking.checked) {
        json.parkingType = 'none'
    } else {
        json.parkingType = null
    }

    // Remove individual parking checkbox fields from json
    delete json.freeParking
    delete json.paidParking
    delete json.noParking

    // Handle links from the array
    json.links = linksField.value

    return json
}

// listen for form submissions  
myForm.addEventListener('submit', async event => {
    event.preventDefault()
    const data = getFormData()
    await saveItem(data)
    myForm.reset()
    resetFormUI()
    formDialog.close()
})

// Open dialog when create button clicked
createButton.addEventListener('click', () => {
    formHeading.textContent = '📍 Add Study Spot'
    myForm.reset()
    resetFormUI()
    formDialog.showModal()
})

// Close dialog when cancel button clicked
cancelButton.addEventListener('click', () => {
    formDialog.close()
})

// Save button submits the form
saveButton.addEventListener('click', () => {
    myForm.requestSubmit()
})

// Reset form UI (links, etc)
const resetFormUI = () => {
    links = []
    renderLinks()
    linksInput.value = ''
}

// Save item (Create or Update)
const saveItem = async (data) => {
    console.log('Saving:', data)

    const endpoint = data.id ? `/data/${data.id}` : '/data'
    const method = data.id ? "PUT" : "POST"

    const options = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    try {
        const response = await fetch(endpoint, options)

        if (!response.ok) {
            try {
                const errorData = await response.json()
                console.error('Error:', errorData)
                alert(errorData.error || response.statusText)
            }
            catch (err) {
                console.error(response.statusText)
                alert('Failed to save: ' + response.statusText)
            }
            return
        }

        const result = await response.json()
        console.log('Saved:', result)

        // Refresh the data list
        getData()
    }
    catch (err) {
        console.error('Save error:', err)
        alert('An error occurred while saving')
    }
}

// Edit item - populate form with existing data
const editItem = (data) => {
    console.log('Editing:', data)

    formHeading.textContent = '📍 Edit Study Spot'

    // Populate the form with data to be edited
    Object.keys(data).forEach(field => {
        const element = myForm.elements[field]
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[field]
            } else if (field === 'links') {
                // Parse links from JSON string
                try {
                    links = JSON.parse(data[field] || '[]')
                    renderLinks()
                } catch (e) {
                    links = []
                    renderLinks()
                }
            } else {
                element.value = data[field] || ''
            }
        }
    })

    // Update image preview if image exists
    const imagePreview = document.querySelector('#imagePreview')
    if (data.imageUrl) {
        imagePreview.setAttribute('src', data.imageUrl)
    } else {
        imagePreview.setAttribute('src', 'assets/photo.svg')
    }

    // Update remove button visibility
    if (typeof updateButtonVisibility === 'function') {
        updateButtonVisibility()
    }

    // Show the dialog
    formDialog.showModal()
}

// Delete item
const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this study spot?')) {
        return
    }

    const endpoint = `/data/${id}`
    const options = { method: "DELETE" }

    try {
        const response = await fetch(endpoint, options)

        if (response.ok) {
            const result = await response.json()
            console.log('Deleted:', result)
            getData()
        }
        else {
            const errorData = await response.json()
            alert(errorData.error || 'Failed to delete item')
        }
    } catch (error) {
        console.error('Delete error:', error)
        alert('An error occurred while deleting')
    }
}

// Render a single item
const renderItem = (item) => {
    const div = document.createElement('div')
    div.classList.add('item-card')
    div.setAttribute('data-id', item.id)
    div.setAttribute('data-spottype', item.spotType.toLowerCase())

    const imageHTML = item.imageUrl ?
        `<div class="item-image-area" style="background: url(${item.imageUrl});">
            <div class="item-image-container">
                <img src="${item.imageUrl}" alt="${item.name}" class="item-image" />
            </div>
        </div>`
        : ''

    const linksHTML = item.links ? (() => {
        try {
            const linkArray = JSON.parse(item.links)
            if (linkArray.length > 0) {
                return `<div class="item-links">
                    <strong>Links:</strong>
                    ${linkArray.map(link => `<a href="${link}" target="_blank">${link}</a>`).join(', ')}
                </div>`
            }
        } catch (e) {
            return ''
        }
        return ''
    })() : ''

    const template = /*html*/`
        ${imageHTML}
    
        <div class="item-heading">
            <h3>${item.name}</h3>
            <p class="item-type">${item.spotType}</p>
        </div>
        
        <div class="item-info">
            <p><strong>📍 Address:</strong> ${item.address}</p>
        </div>
        
        <div class="item-features">
            ${item.hasWifi ? '<span class="feature">📶 WiFi</span>' : ''}
            ${item.hasOutlets ? '<span class="feature">🔌 Outlets</span>' : ''}
            ${item.hasIndoorSeating ? '<span class="feature">🪑 Indoor Seating</span>' : ''}
            ${item.hasOutdoorSeating ? '<span class="feature">🌳 Outdoor Seating</span>' : ''}
            ${item.hasRestroom ? '<span class="feature">🚻 Restroom</span>' : ''}
            ${item.acceptsCreditCard ? '<span class="feature">💳 Credit Card</span>' : ''}
            ${item.parkingType === 'free' ? '<span class="feature">🅿️ Free Parking</span>' : ''}
            ${item.parkingType === 'paid' ? '<span class="feature">🅿️ Paid Parking</span>' : ''}
        </div>

        <div class="item-details-hidden">
            ${item.hours ? `<p><strong>⏰ Hours:</strong> ${item.hours}</p>` : ''}
            ${item.phoneNumber ? `<p><strong>📞 Phone:</strong> ${item.phoneNumber}</p>` : ''}
            ${linksHTML}
        </div>

        <button class="more-details-btn">More Details</button>

        <div class="item-footer">
            <div class="item-timestamps">
                <small>Created: ${new Date(item.createdAt).toLocaleDateString()}</small>
                <small>Updated: ${new Date(item.updatedAt).toLocaleDateString()}</small>
            </div>
            <div class="item-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
        </div>
    `
    div.innerHTML = DOMPurify.sanitize(template)

    // Add expand/collapse functionality
    const moreDetailsBtn = div.querySelector('.more-details-btn')
    const detailsHidden = div.querySelector('.item-details-hidden')
    
    moreDetailsBtn.addEventListener('click', () => {
        detailsHidden.classList.toggle('expanded')
        moreDetailsBtn.textContent = detailsHidden.classList.contains('expanded') ? 'Less Details' : 'More Details'
    })

    div.querySelector('.edit-btn').addEventListener('click', () => editItem(item))
    div.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id))

    return div
}

// fetch items from API endpoint and populate the content div
const getData = async () => {
    try {
        const response = await fetch('/data')

        if (response.ok) {
            readyStatus.style.display = 'block'
            notReadyStatus.style.display = 'none'

            const data = await response.json()
            console.log('Fetched data:', data)

            if (data.length == 0) {
                contentArea.innerHTML = '<p><i>No study spots found yet. Be the first to add one!</i></p>'
                return
            }
            else {
                contentArea.innerHTML = ''
                data.forEach(item => {
                    const itemDiv = renderItem(item)
                    contentArea.appendChild(itemDiv)
                })
            }
        }
        else {
            notReadyStatus.style.display = 'block'
            readyStatus.style.display = 'none'
            createButton.style.display = 'none'
            contentArea.style.display = 'none'
        }
    } catch (error) {
        console.error('Error fetching data:', error)
        notReadyStatus.style.display = 'block'
    }
}

// Revert to the default form title on reset
myForm.addEventListener('reset', () => {
    formHeading.textContent = '📍 Add Study Spot'
    const imagePreview = document.querySelector('#imagePreview')
    if (imagePreview) {
        imagePreview.setAttribute('src', 'assets/photo.svg')
    }
    if (typeof updateButtonVisibility === 'function') {
        updateButtonVisibility()
    }
})

// Load initial data
getData()
