export const user = {
  name: "Ryan Stanikk",
  title: "Creative Director",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
};

export const initialProjects = [
  { 
    id: 'proj-1', 
    name: 'Soton Restaurant App', 
    priority: 'High',
    dueDate: 'Due Tomorrow',
    description: 'Finalise the UI/UX for the booking flow and integrate the photo assets from last week\'s shoot.',
    progress: 45,
    tasks: [
        {
            id: 'task-1',
            name: 'Select Menu Photos',
            description: 'Choose the best 5 shots for the slider.',
            isDone: false,
            dueDate: new Date(2024, 6, 25),
            subtasks: [
              { id: 'sub-1', label: 'Import RAW files to Lightroom', isDone: true },
              { id: 'sub-2', label: 'Rate 5-star selects', isDone: false },
              { id: 'sub-3', label: 'Export web-ready JPEGs', isDone: false },
            ],
            attachments: [
              { id: 'att-1', type: 'image', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800', alt: 'Menu', label: 'menu-shot-1.jpg' },
              { id: 'att-2', type: 'audio', duration: '0:42', label: 'Feedback from Client', url: '#' },
            ]
        },
        {
            id: 'task-2',
            name: 'Upload to Google Drive',
            description: 'Upload the final assets to the shared client folder.',
            isDone: false,
            dueDate: new Date(2024, 6, 28),
            subtasks: [],
            attachments: [
                { id: 'att-3', type: 'file', label: 'Contract PDF', url: '#' },
            ]
        },
        {
            id: 'task-3',
            name: 'Invoice Client',
            description: 'Generate and send the invoice for the completed milestone.',
            isDone: true,
            dueDate: new Date(2024, 6, 20),
            subtasks: [],
            attachments: []
        }
    ]
  },
  { 
    id: 'proj-2', 
    name: 'Personal Brand', 
    priority: 'Medium',
    dueDate: 'Next Week',
    description: 'Update portfolio and social media assets.',
    progress: 10,
    tasks: [
        {
            id: 'task-4',
            name: 'Update portfolio website',
            description: 'Add new case studies.',
            isDone: false,
            dueDate: new Date(2024, 7, 5),
            subtasks: [
                { id: 'sub-4', label: 'Write case study for Project X', isDone: false },
                { id: 'sub-5', label: 'Gather testimonials', isDone: false },
            ],
            attachments: []
        }
    ]
  },
  { 
    id: 'proj-smart', 
    name: 'Commercial Work',
    smartProject: true,
    priority: 'Medium',
    dueDate: 'Ongoing',
    description: 'This project automatically tracks tasks from your scheduled shoots. Tasks are read-only and managed from the Shoots section.',
    progress: 0,
    tasks: []
  },
];

export const initialShoots = [
    {
        id: 'shoot-1',
        title: 'La Terraza Cafe',
        clientName: 'Maria Rodriguez',
        clientEmail: 'maria@laterrazacafe.com',
        clientContact: '+447533066668',
        shootDate: new Date(2024, 7, 15),
        editDueDate: new Date(2024, 7, 29),
        location: 'The Dancing Man Brewery, Town Quay, Southampton SO14 2AR',
        assets: [
            { id: 'asset-1', label: 'Ref-1.jpg', url: 'https://picsum.photos/seed/shoot1a/400/400' },
            { id: 'asset-2', label: 'Ref-2.jpg', url: 'https://picsum.photos/seed/shoot1b/400/400' },
        ],
        price: 1250,
        invoiceStatus: 'Sent',
        sendSneakPeeks: true,
        frictionLog: 'Client was very happy with the initial shots. Finding the right lighting was tricky but we got there.',
        progress: {
            shoot: true,
            tickoff: true,
            cull: false,
            edit: false,
            exportUpload: false
        }
    },
    {
        id: 'shoot-2',
        title: 'Summer \'24 Collection',
        clientName: 'David Chen',
        clientEmail: 'david.chen@summerco.com',
        clientContact: '+447533066668',
        shootDate: new Date(),
        editDueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        location: 'Shoreditch House, Ebor St, London E1 6AW',
        assets: [],
        price: 2500,
        invoiceStatus: 'Unsent',
        sendSneakPeeks: false,
        frictionLog: '',
        progress: {
            shoot: false,
            tickoff: false,
            cull: false,
            edit: false,
            exportUpload: false
        }
    },
    {
        id: 'shoot-3',
        title: 'Dishoom Manchester',
        clientName: 'Aisha Khan',
        clientEmail: 'aisha.khan@dishoom.com',
        clientContact: '+447533066668',
        shootDate: new Date(2024, 8, 5),
        editDueDate: new Date(2024, 8, 19),
        location: 'Dishoom Manchester, 32 Bridge St, Manchester M3 3BT',
        assets: [],
        price: 1800,
        invoiceStatus: 'Overdue',
        progress: {
            shoot: false,
            tickoff: false,
            cull: false,
            edit: false,
            exportUpload: false
        }
    }
];


export const breakdownSteps = [
  "Step 1: Open the 'La Terraza' folder (Don't look at anything else).",
  "Step 2: Select just ONE photo that looks okay.",
  "Step 3: Drag it into Lightroom."
];
