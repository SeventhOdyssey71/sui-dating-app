'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';
import { User, MapPin, FileText, Calendar, ChevronRight, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export function UserRegistration() {
  const router = useRouter();
  const { registerUser } = useDatingPlatform();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    location: '',
    images: [] as string[],
    interests: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const interestOptions = [
    'Travel', 'Music', 'Sports', 'Fitness', 'Reading', 'Movies',
    'Cooking', 'Gaming', 'Art', 'Photography', 'Dancing', 'Hiking',
    'Yoga', 'Coffee', 'Wine', 'Food', 'Fashion', 'Technology',
    'Nature', 'Pets', 'Volunteering', 'Writing', 'Meditation', 'Beach'
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0 && formData.age && parseInt(formData.age) >= 18;
      case 2:
        return formData.location.trim().length > 0;
      case 3:
        return formData.bio.trim().length >= 10;
      case 4:
        return formData.interests.length >= 3;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        registerUser(
          formData.name,
          formData.bio,
          parseInt(formData.age),
          formData.location,
          () => {
            resolve();
            router.push('/swipe');
          },
          (error) => {
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`text-sm font-medium ${
                    s <= step ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  Step {s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Let's get started!</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tell us a bit about yourself
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <User className="w-4 h-4" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4" />
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter your age"
                    min="18"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Where are you located?</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This helps us find people near you
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 3: Bio */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Write a short bio to help others get to know you
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileText className="w-4 h-4" />
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share something interesting about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Pick your interests</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select at least 3 interests
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Selected: {formData.interests.length} interests
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {step === 4 ? 'Complete' : 'Next'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}