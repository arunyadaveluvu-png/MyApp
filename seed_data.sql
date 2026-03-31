-- Expanded Seed Data for MedicoCrew

-- 1. Insert Detailed Hospitals (8+ Locations)
INSERT INTO public.hospitals (name, location, description, beds, doctors, services, image_url)
VALUES 
('Unity Medical Center', 'Manhattan, NY', 'Premier multi-specialty healthcare facility with world-class infrastructure.', 450, 85, ARRAY['ICU', 'Surgery', 'Diagnostics'], '/images/hospital-unity.png'),
('Metro General Hospital', 'Brooklyn, NY', 'Full-service community hospital dedicated to patient-centered care.', 320, 60, ARRAY['Emergency', 'Pediatrics'], '/images/hospital-metro.png'),
('Sunset Health Clinic', 'Queens, NY', 'A neighborhood clinic providing accessible and compassionate general care.', 150, 25, ARRAY['Dental', 'General'], '/images/hospital-sunset.png'),
('Presbyterian Medical', 'Bronx, NY', 'Renowned for cardiology and neurological research and treatment.', 600, 120, ARRAY['ICU', 'Cardiology', 'Neurology'], '/images/hospital-presbyterian.png'),
('Mayo Speciality Clinic', 'Rochester, MN', 'World-leading medical research and high-complexity patient care.', 1200, 350, ARRAY['Research', 'Oncology', 'Surgery'], '/images/hospital-mayo.png'),
('Cleveland Heart Institute', 'Cleveland, OH', 'Dedicated cardiovascular center with the highest success rates in surgery.', 400, 110, ARRAY['Cardiology', 'ICU', 'Emergency'], '/images/hospital-cleveland.png'),
('Johns Hopkins Medical', 'Baltimore, MD', 'Innovative medical school and hospital known for breakthrough diagnostics.', 800, 280, ARRAY['Diagnostics', 'Pediatrics', 'Neurology'], '/images/hospital-johns-hopkins.png'),
('Childrens Mercy Hospital', 'Kansas City, MO', 'Specialized pediatric care focusing on neonatology and child health.', 350, 95, ARRAY['Pediatrics', 'Neonatal', 'ICU'], '/images/hospital-childrens.png');

-- 2. Insert Expanded Medical Equipment (12+ Items)
INSERT INTO public.equipment (name, category, price, description, supplier, rating, image_url)
VALUES
('Advanced Ventilator V-500', 'ICU', 12500.00, 'Portable ventilator with integrated lung monitoring.', 'MedSystems Pro', 4.8, '/images/equipment-ventilator.png'),
('Laser Surgery Kit X2', 'Surgery', 45000.00, 'Precision laser system for minimally invasive surgery.', 'SurgeTech Solutions', 4.9, '/images/equipment-laser.png'),
('Digital X-Ray Scanner', 'Diagnostics', 89000.00, 'High-resolution digital radiography system.', 'RadX Imaging', 4.7, '/images/equipment-xray.png'),
('Cardiac Monitor M7', 'ICU', 8200.00, 'Real-time hemodynamic monitoring with arrhythmia detection.', 'LifeScan Medical', 4.6, '/images/equipment-ventilator.png'),
('Dental Surgical Unit', 'Dental', 15400.00, 'Complete surgical workstation for oral surgery.', 'DentalWorks', 4.5, '/images/equipment-laser.png'),
('Portable Ultrasound', 'Diagnostics', 18500.00, 'Color Doppler ultrasound for point-of-care imaging.', 'ViewPort Medical', 4.8, '/images/equipment-xray.png'),
('MRI Scanner Tesla 3', 'Diagnostics', 1200000.00, 'State-of-the-art 3-Tesla magnetic resonance imaging.', 'G-Health Tech', 4.9, '/images/equipment-mri.png'),
('da Vinci Surgical Robot', 'Surgery', 2100000.00, 'Robotic-assisted surgery system for extreme precision.', 'Intuitive Surg', 5.0, '/images/equipment-laser.png'),
('Dialysis Machine D-10', 'ICU', 25000.00, 'High-efficiency renal replacement therapy system.', 'RenalCare Pro', 4.7, '/images/hospital-presbyterian.png'),
('Infusion Pump Smart-X', 'General', 1800.00, 'Micro-dosing infusion pump with drug library.', 'FlowSafe Med', 4.5, '/images/equipment-xray.png'),
('Defibrillator D-900', 'Emergency', 4500.00, 'Manual and AED mode biphasic defibrillator.', 'HeartSync', 4.8, '/images/equipment-ventilator.png'),
('Patient Monitor Elite', 'General', 6500.00, 'Multiparameter monitor with 15-inch touchscreen.', 'VitalSense', 4.6, '/images/hospital-metro.png');
