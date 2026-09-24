import { todayISO } from '../shared/utils/date.js'

export function buildDefaultState() {
  const plants = [
    plant('p1', 'Luna', 'Monstera Deliciosa', 'Living Room Window', 'indoor', 'Bright Indirect', 'Weekly', 'Monthly', 'Good', -4, 'Water', 1, 'Loves the morning light by the window.', -60),
    plant('p2', 'Basil', 'Ocimum Basilicum', 'Kitchen Sill', 'indoor', 'Full Sun', 'Every 3 days', 'Every 2 weeks', 'Needs Attention', -3, 'Fertilize', 0, 'Wilting a little after the heat wave.', -40),
    plant('p3', 'Sunny', 'Aloe Vera', 'Balcony', 'outdoor', 'Full Sun', 'Every 2 weeks', 'Seasonal', 'Healthy', -9, 'Water', 4, 'Very low maintenance, thriving.', -120),
    plant('p4', 'Spike', 'Snake Plant', 'Hallway Corner', 'indoor', 'Low Light', 'Every 2 weeks', 'Every 6 weeks', 'Healthy', -11, 'Check', 2, 'Barely needs anything, great starter plant.', -200),
    plant('p5', 'Ivy', 'English Ivy', 'Bathroom Shelf', 'indoor', 'Medium Light', 'Weekly', 'Monthly', 'Good', -5, 'Water', 2, 'Enjoys the humidity in here.', -75),
    plant('p6', 'Minty', 'Mint', 'Kitchen Sill', 'indoor', 'Bright Indirect', 'Every 3 days', 'Every 2 weeks', 'Healthy', -2, 'Water', 1, 'Growing fast, might need repotting soon.', -30),
    plant('p7', 'Percy', 'Pothos', 'Office Desk', 'indoor', 'Low Light', 'Weekly', 'Monthly', 'Good', -6, 'Water', 1, 'Trailing nicely along the shelf.', -55),
    plant('p8', 'Lily', 'Peace Lily', 'Bedroom', 'indoor', 'Medium Light', 'Weekly', 'Every 6 weeks', 'Needs Attention', -8, 'Water', -1, 'Drooping; likely overdue for water.', -95),
    plant('p9', 'Webster', 'Spider Plant', 'Balcony', 'outdoor', 'Bright Indirect', 'Every 10 days', 'Monthly', 'Healthy', -3, 'Water', 6, 'Sending out new babies.', -140),
    plant('p10', 'Coco', 'Monstera Deliciosa', 'Reading Nook', 'indoor', 'Bright Indirect', 'Weekly', 'Monthly', 'Good', -4, 'Rotate', 1, 'Rotate weekly for even growth.', -50),
  ]

  return {
    plants,
    tasks: [
      task('t1', 'p1', 'Water', 0, '8:00 AM', 'pending', 'medium'),
      task('t2', 'p2', 'Fertilize', 0, '9:00 AM', 'pending', 'high'),
      task('t3', 'p4', 'Check', 0, 'Anytime', 'pending', 'low'),
      task('t4', 'p7', 'Rotate', 0, 'Anytime', 'pending', 'low'),
      task('t5', 'p8', 'Water', -1, '8:00 AM', 'overdue', 'high'),
      task('t6', 'p3', 'Water', 4, '8:00 AM', 'pending', 'low'),
      task('t7', 'p5', 'Water', 2, '8:00 AM', 'pending', 'medium'),
      task('t8', 'p6', 'Water', 1, '8:00 AM', 'pending', 'medium'),
      task('t9', 'p9', 'Water', 6, '8:00 AM', 'pending', 'low'),
      task('t10', 'p10', 'Rotate', 1, 'Anytime', 'pending', 'low'),
      task('t11', 'p1', 'Fertilize', 12, '9:00 AM', 'pending', 'low'),
      task('t12', 'p4', 'Fertilize', 20, '9:00 AM', 'pending', 'low'),
      task('t13', 'p2', 'Water', -2, '8:00 AM', 'completed', 'medium'),
      task('t14', 'p1', 'Water', -4, '8:00 AM', 'completed', 'medium'),
      task('t15', 'p5', 'Fertilize', -6, '9:00 AM', 'completed', 'low'),
      task('t16', 'p7', 'Water', -6, '8:00 AM', 'completed', 'medium'),
      task('t17', 'p8', 'Prune', -10, 'Anytime', 'completed', 'low'),
      task('t18', 'p3', 'Fertilize', -15, '9:00 AM', 'completed', 'low'),
    ],
    journal: [
      journal('j1', 'p1', 'Watered', -4, 'Leaves appear healthy and upright.'),
      journal('j2', 'p4', 'Checked Health', -15, 'No changes, still doing great.'),
      journal('j3', 'p2', 'Fertilized', -6, 'Added diluted liquid fertilizer.'),
      journal('j4', 'p3', 'Checked Health', -20, 'Updated Aloe Vera health status to Healthy.'),
      journal('j5', 'p4', 'Other', -10, 'Added note to Snake Plant about slow but steady growth.'),
      journal('j6', 'p8', 'Checked Health', -1, 'Leaves drooping, moved up next watering.'),
      journal('j7', 'p6', 'Pruned', -8, 'Trimmed back leggy stems.'),
      journal('j8', 'p9', 'Repotted', -25, 'Moved to a slightly bigger pot, roots were crowded.'),
      journal('j9', 'p7', 'Cleaned', -12, 'Wiped dust off the leaves.'),
      journal('j10', 'p10', 'Watered', -4, 'Soil was fully dry, gave a deep water.'),
      journal('j11', 'p5', 'Fertilized', -6, 'Light feeding before the humid season.'),
      journal('j12', 'p2', 'Checked Health', -2, 'Noticed slight wilting, watching closely.'),
    ],
    notifications: [
      notice('n1', '🌱', 'Luna needs watering today.', 0, false, 'plants', 'p1'),
      notice('n2', '🌿', 'Basil fertilizer is due today.', 0, false, 'plants', 'p2'),
      notice('n3', '⚠', 'Peace Lily watering is overdue.', -1, false, 'plants', 'p8'),
      notice('n4', '🪴', "Snake Plant hasn't been checked recently.", -1, false, 'plants', 'p4'),
      notice('n5', '✂', 'Mint may need pruning soon; growing quickly.', -3, true, 'plants', 'p6'),
      notice('n6', '🌸', 'Peace Lily is showing signs it needs attention.', -1, false, 'health'),
      notice('n7', '🌾', 'Spider Plant produced new offshoots.', -25, true, 'plants', 'p9'),
      notice('n8', '🪴', 'Aloe Vera watering is coming up in 4 days.', 0, true, 'schedule'),
      notice('n9', '🌿', 'Weekly care summary is ready in Reports.', -2, true, 'reports'),
    ],
    library: [
      species('s1', 'Monstera Deliciosa', 'Monstera deliciosa', 'Beginner', 'Bright Indirect', 'Weekly', 'Monthly during growing season', 'indoor', 'medium', 'A fast-growing tropical climber known for its dramatic split leaves. Thrives with something to climb on.', ['Yellow leaves from overwatering', 'Brown crispy edges from low humidity', 'Small, unsplit leaves from insufficient light'], ['Water when the top 2 inches of soil are dry', 'Wipe leaves to keep them dust-free', 'Provide a moss pole for climbing']),
      species('s2', 'Snake Plant', 'Dracaena trifasciata', 'Beginner', 'Low to Bright Indirect', 'Every 2-3 weeks', 'Every 2 months', 'indoor', 'low', 'An upright, sculptural plant that tolerates neglect and low light exceptionally well.', ['Root rot from overwatering', 'Wrinkled leaves from underwatering'], ['Let soil dry out completely between waterings', 'Avoid cold drafts', 'Use well-draining, sandy soil']),
      species('s3', 'Aloe Vera', 'Aloe barbadensis miller', 'Beginner', 'Full Sun', 'Every 2-3 weeks', 'Seasonal, light feeding', 'outdoor', 'medium', 'A succulent prized for its soothing gel and easygoing care needs.', ['Mushy leaves from overwatering', 'Thin, curling leaves from underwatering'], ['Use a cactus/succulent soil mix', 'Water deeply, then let dry fully', 'Give at least 6 hours of sun']),
      species('s4', 'Pothos', 'Epipremnum aureum', 'Beginner', 'Low to Medium Light', 'Weekly', 'Monthly', 'indoor', 'low', 'A trailing vine that adapts to almost any indoor condition, a favorite first plant.', ['Yellow leaves from overwatering', 'Leggy vines from insufficient light'], ['Let soil dry between waterings', 'Trim regularly to encourage fullness', 'Propagates easily in water']),
      species('s5', 'Peace Lily', 'Spathiphyllum wallisii', 'Intermediate', 'Medium Light', 'Weekly', 'Every 6 weeks', 'indoor', 'medium', 'An elegant flowering houseplant that dramatically droops to signal thirst.', ['Drooping from underwatering', 'Brown tips from tap water minerals or low humidity'], ['Water as soon as leaves start to droop', 'Use filtered or rested water', 'Keep away from cold drafts']),
      species('s6', 'Basil', 'Ocimum basilicum', 'Beginner', 'Full Sun', 'Every 2-3 days', 'Every 2 weeks', 'indoor', 'medium', 'A fragrant culinary herb that rewards frequent harvesting with bushier growth.', ['Wilting in heat or dry soil', 'Yellow leaves from overwatering or nutrient deficiency'], ['Keep soil consistently moist, not soggy', 'Pinch off flower buds to prolong leaf production', 'Harvest from the top down']),
      species('s7', 'Spider Plant', 'Chlorophytum comosum', 'Beginner', 'Bright Indirect', 'Every 7-10 days', 'Monthly', 'indoor', 'medium', 'A resilient plant that produces charming plantlets on long stems.', ['Brown tips from fluoride/chlorine in tap water', 'Pale leaves from too much direct sun'], ['Use distilled or rain water if possible', 'Remove plantlets to propagate new plants', 'Trim brown tips with clean scissors']),
      species('s8', 'English Ivy', 'Hedera helix', 'Intermediate', 'Medium Light', 'Weekly', 'Monthly', 'indoor', 'medium', 'A classic trailing vine that enjoys cooler, humid rooms like bathrooms.', ['Spider mites in dry air', 'Yellowing from overwatering'], ['Mist regularly or use a humidity tray', 'Prune to prevent legginess', 'Check leaf undersides for pests']),
    ],
    healthIssues: {
      'Yellow Leaves': { causes: ['Overwatering', 'Insufficient light', 'Nutrient deficiency'], tips: ['Check soil moisture before watering again', 'Review watering frequency', 'Move the plant to appropriate lighting'] },
      Wilting: { causes: ['Underwatering', 'Root stress', 'Heat exposure'], tips: ['Water thoroughly and check drainage', 'Move away from direct heat sources', "Check roots aren't bound or rotting"] },
      Pests: { causes: ['Poor air circulation', 'Overwatering', 'Nearby infested plants'], tips: ['Isolate the affected plant', 'Wipe leaves with diluted neem oil', 'Improve airflow around the plant'] },
      'Brown Leaves': { causes: ['Low humidity', 'Mineral buildup from tap water', 'Sunburn'], tips: ['Increase humidity with a tray or misting', 'Use filtered or rested water', 'Move out of direct harsh sun'] },
      Overwatering: { causes: ['Watering on a fixed schedule', 'Poor drainage', 'Pot without drainage holes'], tips: ['Let soil dry before watering again', 'Ensure pots have drainage holes', 'Repot in well-draining soil if needed'] },
      Underwatering: { causes: ['Forgetting scheduled waterings', 'Fast-draining soil mix', 'Low humidity environment'], tips: ['Set reminders for consistent watering', 'Water deeply until it drains out the bottom', 'Group plants to raise local humidity'] },
    },
    profile: { name: 'Alex Rivera', email: 'alex.rivera@example.com', location: 'Quezon City, PH', photo: null, role: 'Plant Enthusiast' },
    settings: { careReminders: true, overdueReminders: true, healthAlerts: true, browserNotifs: false, theme: 'light', reminderTime: '08:00', weekStart: 'mon' },
    activity: [
      { text: 'Watered Luna', time: `${todayISO(-4)} · 8:02 AM` },
      { text: 'Added note to Snake Plant', time: `${todayISO(-10)} · 6:40 PM` },
      { text: 'Fertilized Basil', time: `${todayISO(-6)} · 9:15 AM` },
      { text: 'Updated Aloe Vera health', time: `${todayISO(-20)} · 7:30 PM` },
      { text: 'Repotted Spider Plant', time: `${todayISO(-25)} · 11:00 AM` },
    ],
    adminReports: [
      { id: 'r1', subject: 'Incorrect plant information', detail: 'Watering frequency for Peace Lily looks too frequent.', status: 'open' },
      { id: 'r2', subject: 'Diagnosis result feedback', detail: 'Diagnosis suggested overwatering but plant was underwatered.', status: 'open' },
      { id: 'r3', subject: 'Incorrect plant information', detail: "Snake Plant listed as 'Low Light' should include 'Bright Indirect' too.", status: 'resolved' },
      { id: 'r4', subject: 'Diagnosis result feedback', detail: 'Confidence score seemed too high for a blurry photo.', status: 'dismissed' },
    ],
  }
}

function plant(id, name, species, location, zone, light, watering, fertilizing, health, lastWateredOffset, nextType, nextOffset, notes, addedOffset) {
  return {
    id,
    name,
    species,
    location,
    zone,
    light,
    watering,
    fertilizing,
    health,
    lastWatered: todayISO(lastWateredOffset),
    nextTask: { type: nextType, date: todayISO(nextOffset) },
    notes,
    photo: null,
    added: todayISO(addedOffset),
    timeline: [
      { label: 'Plant added', date: todayISO(addedOffset) },
      { label: 'First watering', date: todayISO(Math.min(addedOffset + 2, -1)) },
      { label: health === 'Needs Attention' ? 'Health updated' : 'New leaf observed', date: todayISO(Math.min(nextOffset - 2, -1)) },
    ],
  }
}

function task(id, plantId, type, dateOffset, time, status, priority) {
  return { id, plantId, type, date: todayISO(dateOffset), time, status, priority }
}

function journal(id, plantId, activity, dateOffset, notes) {
  return { id, plantId, activity, date: todayISO(dateOffset), notes, photo: null }
}

function notice(id, icon, text, dateOffset, read, page, plantId) {
  return { id, icon, text, time: todayISO(dateOffset), read, page, plantId }
}

function species(id, common, scientific, difficulty, light, watering, fertilizing, zone, lightLevel, description, problems, tips) {
  return { id, common, scientific, difficulty, light, watering, fertilizing, zone, lightLevel, description, problems, tips }
}
