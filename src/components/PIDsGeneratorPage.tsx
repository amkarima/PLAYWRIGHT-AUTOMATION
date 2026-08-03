import React, { useState, useRef, useEffect } from 'react';
import { Download, User, Calendar, MapPin } from 'lucide-react';

interface PersonData {
  nom: string;
  prenoms: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: 'M' | 'F';
}

const PIDsGeneratorPage: React.FC = () => {
  const [formData, setFormData] = useState<PersonData>({
    nom: '',
    prenoms: '',
    dateNaissance: '',
    lieuNaissance: 'PARIS',
    sexe: 'F'
  });
  const [generatedImageRecto, setGeneratedImageRecto] = useState<string | null>(null);
  const [generatedImageVerso, setGeneratedImageVerso] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRectoRef = useRef<HTMLCanvasElement>(null);
  const canvasVersoRef = useRef<HTMLCanvasElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePID = async () => {
    if (!formData.nom || !formData.prenoms || !formData.dateNaissance) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsGenerating(true);

    try {
      await generateRecto();
      await generateVerso();
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setIsGenerating(false);
    }
  };

  const generateRecto = async () => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasRectoRef.current;
      if (!canvas) {
        reject('Canvas non disponible');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Contexte canvas non disponible');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        ctx.font = '40px sans-serif';
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        const nomX = 377;
        const nomY = 180;
        ctx.fillText(formData.nom.toUpperCase(), nomX, nomY);

        const prenomsX = 377;
        const prenomsY = 260;
        ctx.fillText(formData.prenoms, prenomsX, prenomsY);

        ctx.font = '30px sans-serif';
        const dateX = 694;
        const dateY = 323;
        const [year, month, day] = formData.dateNaissance.split('-');
        const formattedDate = `${day}.${month}.${year}`;
        ctx.fillText(formattedDate, dateX, dateY);

        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImageRecto(dataUrl);
        resolve();
      };

      img.onerror = () => {
        reject('Erreur lors du chargement de l\'image template recto');
      };

      img.src = '/images/cn-template-recto.png';
    });
  };

  const generateVerso = async () => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasVersoRef.current;
      if (!canvas) {
        reject('Canvas non disponible');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Contexte canvas non disponible');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        ctx.font = '20px arial';
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        const [year, month, day] = formData.dateNaissance.split('-');
        const yy = year.slice(-2);
        const formattedDate = `${yy}${month}${day}`;

        ctx.fillText(formData.nom.toUpperCase(), 37, 300);
        ctx.fillText(formData.prenoms.toUpperCase(), 166, 300);
        ctx.fillText("TESTS", 280, 300);
        ctx.fillText("AUTO", 391, 300);
        ctx.font = '25px arial';

        ctx.fillText(formattedDate, 36, 276);


        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImageVerso(dataUrl);
        setIsGenerating(false);
        resolve();
      };

      img.onerror = () => {
        reject('Erreur lors du chargement de l\'image template verso');
        setIsGenerating(false);
      };

      img.src = '/images/cn-template-verso copy.png';
    });
  };

  const downloadBothPID = async () => {
    if (!generatedImageRecto || !generatedImageVerso) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const rectoBlob = await fetch(generatedImageRecto).then(r => r.blob());
    const versoBlob = await fetch(generatedImageVerso).then(r => r.blob());

    zip.file(`CNI_${formData.nom}_${formData.prenoms}_recto.png`, rectoBlob);
    zip.file(`CNI_${formData.nom}_${formData.prenoms}_verso.png`, versoBlob);

    const content = await zip.generateAsync({ type: 'blob' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `CNI_${formData.nom}_${formData.prenoms}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const fillRandomData = () => {
    const noms = ['DUPONT', 'MARTIN', 'BERNARD', 'DUBOIS', 'THOMAS', 'ROBERT', 'PETIT', 'RICHARD', 'DURAND', 'LEROY'];
    const prenoms = ['Marie', 'Jean', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Louis', 'Camille', 'Jules', 'Léa'];
    const lieux = ['PARIS', 'LYON', 'MARSEILLE', 'TOULOUSE', 'NICE', 'NANTES', 'BORDEAUX', 'LILLE', 'RENNES', 'STRASBOURG'];

    const randomDate = new Date(
      1950 + Math.floor(Math.random() * 50),
      Math.floor(Math.random() * 12),
      1 + Math.floor(Math.random() * 28)
    );

    setFormData({
      nom: noms[Math.floor(Math.random() * noms.length)],
      prenoms: prenoms[Math.floor(Math.random() * prenoms.length)],
      dateNaissance: randomDate.toISOString().split('T')[0],
      lieuNaissance: lieux[Math.floor(Math.random() * lieux.length)],
      sexe: Math.random() > 0.5 ? 'M' : 'F'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Générateur de Pièces d'Identité de Test</h1>
              <p className="text-gray-600">Créez des cartes nationales d'identité fictives pour vos tests</p>
            </div>
            <User className="w-12 h-12 text-blue-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="DUPONT"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom(s) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="prenoms"
                value={formData.prenoms}
                onChange={handleInputChange}
                placeholder="Marie"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date de naissance <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Lieu de naissance
              </label>
              <input
                type="text"
                name="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={handleInputChange}
                placeholder="PARIS"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexe
              </label>
              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={generatePID}
              disabled={isGenerating}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer la pièce d\'identité'}
            </button>
            <button
              onClick={fillRandomData}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Remplir aléatoirement
            </button>
          </div>
        </div>

        {(generatedImageRecto && generatedImageVerso) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Pièce d'identité générée</h2>
              <button
                onClick={downloadBothPID}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger (ZIP)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Recto</h3>
                <img
                  src={generatedImageRecto}
                  alt="Recto de la pièce d'identité"
                  className="w-full h-auto rounded-lg shadow-md border-2 border-gray-200"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Verso</h3>
                <img
                  src={generatedImageVerso}
                  alt="Verso de la pièce d'identité"
                  className="w-full h-auto rounded-lg shadow-md border-2 border-gray-200"
                />
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              Ces pièces d'identité sont uniquement destinées à des fins de test et n'ont aucune valeur légale.
            </p>
          </div>
        )}

        <canvas ref={canvasRectoRef} className="hidden" />
        <canvas ref={canvasVersoRef} className="hidden" />
      </div>
    </div>
  );
};

export default PIDsGeneratorPage;
